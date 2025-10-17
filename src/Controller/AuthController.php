<?php

// src/Controller/AuthController.php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private MailerInterface $mailer,
        private LoggerInterface $logger,
        private ValidatorInterface $validator,
        private string $frontendUrl, // injecté via services.yaml
    ) {
    }

    /**
     * Register a new user.
     *
     * POST /api/register
     * Body: { "email": "...", "password": "...", "firstName": "...", "lastName": "..." }
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            /** @var array<string,mixed> $data */
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $this->logger->warning('Register: invalid JSON', ['exception' => $e->getMessage()]);

            return $this->json(['error' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        // extrait de façon sûre et convertit seulement si la valeur est scalare
        $rawEmail = $data['email'] ?? null;
        $rawPassword = $data['password'] ?? null;
        $rawFirst = $data['firstName'] ?? ($data['first_name'] ?? null);
        $rawLast = $data['lastName'] ?? ($data['last_name'] ?? null);

        $email = \is_scalar($rawEmail) ? \trim((string) $rawEmail) : null;
        $plainPassword = \is_scalar($rawPassword) ? (string) $rawPassword : null;
        $firstName = \is_scalar($rawFirst) ? \trim((string) $rawFirst) : null;
        $lastName = \is_scalar($rawLast) ? \trim((string) $rawLast) : null;

        $this->logger->info('Register payload received', [
            'payload' => $data,
            'parsed' => ['email' => $email, 'firstName' => $firstName, 'lastName' => $lastName],
        ]);

        if (!$email || !$plainPassword) {
            return $this->json(['error' => 'Missing credentials'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
        if ($repo->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'Email already used'], Response::HTTP_CONFLICT);
        }

        $user = (new User())
            ->setEmail($email)
            ->setFirstName($firstName)
            ->setLastName($lastName)
            ->setRoles(['ROLE_USER'])
            ->setIsConfirmed(false)
        ;
        $user->setPassword($this->passwordHasher->hashPassword($user, (string) $plainPassword));

        $token = \bin2hex(\random_bytes(16));
        $user->setConfirmationToken($token);
        $this->logger->info('Register token generated', ['email' => $email, 'token' => $token]);

        // Gestion des erreurs et affichage JSON clair
        $violations = $this->validator->validate($user);
        if (\count($violations) > 0) {
            $errors = [];
            foreach ($violations as $v) {
                $errors[] = [
                    'propertyPath' => $v->getPropertyPath(),
                    'message' => $v->getMessage(),
                ];
            }

            return $this->json([
                'message' => 'Validation failed',
                'violations' => $errors,
            ], 422);
        }

        $this->em->persist($user);
        $this->em->flush();

        try {
            $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);
            $emailMessage = (new Email())
                ->from('noreply@example.com')
                ->to($email)
                ->subject('Confirmez votre compte')
                ->text("Merci de confirmer votre compte : $confirmUrl");
        
            $this->mailer->send($emailMessage);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send confirmation email', ['exception' => $e->getMessage()]);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'fullName' => $user->getFullName(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Confirm user email with a token.
     *
     * GET /api/confirm/{token}
     *
     * - {token}: string reçu par email
     *
     * Workflow :
     *  - Vérifie si le token correspond à un utilisateur non confirmé
     *  - Active son compte (setIsVerified(true))
     *  - Supprime ou invalide le token
     *  - Retourne un message de succès ou d'erreur
     */
    #[Route('/confirm', name: 'confirm_user', methods: ['GET'])]
    public function confirm(Request $request): JsonResponse
    {
        $token = $request->query->get('token');
        $this->logger->info('Confirm called', ['token' => $token]);

        if (!$token) {
            $this->logger->warning('Confirm: missing token');

            return $this->json(['error' => 'Token manquant'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
        /** @var User|null $user */
        $user = $repo->findOneBy(['confirmationToken' => $token]);

        if (!$user) {
            $this->logger->info('Confirm: token not found', ['token' => $token]);

            return $this->json(['error' => 'Token invalide, veuillez vérifier votre boîte mail'], Response::HTTP_BAD_REQUEST);
        }

        if ($user->isConfirmed()) {
            $this->logger->info('Confirm: token already used', ['userId' => $user->getId()]);

            return $this->json(['message' => 'Compte déjà confirmé'], Response::HTTP_OK);
        }

        $user->setIsConfirmed(true);
        $user->setConfirmationToken(null);
        $this->em->flush();

        $this->logger->info('Confirm: success', ['userId' => $user->getId()]);

        return $this->json(['message' => 'Compte confirmé. Vous pouvez maintenant vous connecter.'], Response::HTTP_OK);
    }

    /**
     * Resend user confirmation email.
     *
     * POST /api/resend-confirmation
     */
    #[Route('/resend-confirmation', name: 'resend_confirmation', methods: ['POST'])]
    public function resendConfirmation(Request $request): JsonResponse
    {
        try {
            $data = $request->toArray();
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Invalid JSON'], Response::HTTP_BAD_REQUEST);
        }

        $rawEmail = $data['email'] ?? null;
        $email = \is_scalar($rawEmail) ? \trim((string) $rawEmail) : null;
        if (!$email) {
            return $this->json(['error' => 'Missing email'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
        /** @var User|null $user */
        $user = $repo->findOneBy(['email' => $email]);

        if (!$user) {
            // Ne pas révéler que l'email n'existe pas — renvoyer succès neutre
            return $this->json(['message' => 'If the email exists, a confirmation mail has been sent.'], Response::HTTP_OK);
        }

        if ($user->isConfirmed()) {
            return $this->json(['message' => 'Compte déjà confirmé.'], Response::HTTP_OK);
        }

        // regen token
        $token = \bin2hex(\random_bytes(16));
        $user->setConfirmationToken($token);
        $this->em->flush();

        // send email (comme dans register)
        try {
            $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);
            $emailMessage = (new Email())
                ->from('noreply@example.com')
                ->to((string) $email)
                ->subject('Confirmez votre compte')
                ->text("Merci de confirmer votre compte : $confirmUrl");
            $this->mailer->send($emailMessage);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send confirmation email', ['exception' => $e->getMessage()]);
        }

        return $this->json(['message' => 'Un e-mail de confirmation a été renvoyé si l’adresse existe.'], Response::HTTP_OK);
    }

    /**
     * Return current user (requires JWT).
     *
     * GET /api/me
     */
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ]);
    }
}
