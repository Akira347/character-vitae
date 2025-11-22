<?php

// src/Controller/AuthController.php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Exception\ParameterNotFoundException;
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
        private MailerInterface $mailer, // <- injecté pour que les tests puissent remplacer le service
        private LoggerInterface $logger,
        private ValidatorInterface $validator,
        private string $frontendUrl, // injecté via services.yaml (%env(FRONTEND_URL)%)
    ) {
    }

    /**
     * Register a new user.
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

        // extract safely
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

        // Validation
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

        // Build confirm URL BEFORE try/catch
        $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);

        // Determine 'from' address safely (avoid calling container methods that don't exist in test container)
        $from = 'noreply@example.com';
        try {
            $param = $this->getParameter('mailer_from'); // may throw ParameterNotFoundException
            if (\is_scalar($param) && (string) $param !== '') {
                $from = (string) $param;
            }
        } catch (\InvalidArgumentException $e) {
            // parameter not set -> keep default
        }

        // Try to send confirmation email
        try {
            $emailMessage = (new Email())
                ->from((string) $from)
                ->to((string) $email)
                ->subject('Confirmez votre compte')
                ->text("Merci de confirmer votre compte : $confirmUrl")
            ;

            $dsn = getenv('MAILER_DSN') ?: 'not-set';
            $masked = preg_replace('#^(.*://)[^@]+@#', '$1****:****@', $dsn);
            $this->logger->info('mailer:using-dsn', ['mailer_dsn_masked' => $masked]);

            $this->mailer->send($emailMessage);
            $this->logger->info('Confirmation email dispatched', ['to' => $email]);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send confirmation email', ['exception' => $e->getMessage()]);
            // don't fail registration because of mail issues
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'firstName' => $user->getFirstName(),
            'lastName' => $user->getLastName(),
            'fullName' => $user->getFullName(),
        ], Response::HTTP_CREATED);
    }

    // ... confirm(), resendConfirmation(), me() unchanged except using $this->mailer and same safe mailer_from logic
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
            return $this->json(['message' => 'If the email exists, a confirmation mail has been sent.'], Response::HTTP_OK);
        }

        if ($user->isConfirmed()) {
            return $this->json(['message' => 'Compte déjà confirmé.'], Response::HTTP_OK);
        }

        $token = \bin2hex(\random_bytes(16));
        $user->setConfirmationToken($token);
        $this->em->flush();

        $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);

        // Determine 'from' address in a safe way (getParameter may throw if missing)
        $from = 'noreply@example.com';
        try {
            $param = $this->getParameter('mailer_from'); // may throw InvalidArgumentException
            if (\is_scalar($param) && (string) $param !== '') {
                $from = (string) $param;
            }
        } catch (\InvalidArgumentException $e) {
            // parameter not set -> keep default
        }

        try {
            $emailMessage = (new Email())
                ->from((string) $from)
                ->to((string) $email)
                ->subject('Confirmez votre compte')
                ->text("Merci de confirmer votre compte : $confirmUrl");
            $this->mailer->send($emailMessage);
        } catch (\Throwable $e) {
            $this->logger->error('Failed to send confirmation email', ['exception' => $e->getMessage()]);
        }

        return $this->json(['message' => 'Un e-mail de confirmation a été renvoyé si l’adresse existe.'], Response::HTTP_OK);
    }

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
