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
    private EntityManagerInterface $em;
    private UserPasswordHasherInterface $passwordHasher;
    private MailerInterface $mailer;
    private LoggerInterface $logger;
    private ValidatorInterface $validator;
    private string $frontendUrl;

    public function __construct(
        EntityManagerInterface $em,
        UserPasswordHasherInterface $passwordHasher,
        MailerInterface $mailer,
        LoggerInterface $logger,
        ValidatorInterface $validator,
        string $frontendUrl,
    ) {
        $this->em = $em;
        $this->passwordHasher = $passwordHasher;
        $this->mailer = $mailer;
        $this->logger = $logger;
        $this->validator = $validator;
        $this->frontendUrl = $frontendUrl;
    }

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        try {
            /** @var array<string,mixed> $data */
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $this->logger->warning('Register: invalid JSON');

            return $this->json(['error' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        $rawEmail = $data['email'] ?? null;
        $rawPassword = $data['password'] ?? null;
        $rawFirst = $data['firstName'] ?? ($data['first_name'] ?? null);
        $rawLast = $data['lastName'] ?? ($data['last_name'] ?? null);

        $email = \is_scalar($rawEmail) ? \trim((string) $rawEmail) : null;
        $plainPassword = \is_scalar($rawPassword) ? (string) $rawPassword : null;
        $firstName = \is_scalar($rawFirst) ? \trim((string) $rawFirst) : null;
        $lastName = \is_scalar($rawLast) ? \trim((string) $rawLast) : null;

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
            ->setIsConfirmed(false);

        $user->setPassword($this->passwordHasher->hashPassword($user, $plainPassword));
        $token = \bin2hex(\random_bytes(16));
        $user->setConfirmationToken($token);

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

            return $this->json(['message' => 'Validation failed', 'violations' => $errors], 422);
        }

        $this->em->persist($user);
        $this->em->flush();

        $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);

        // from param fallback
        $from = 'noreply@example.com';
        try {
            $param = $this->getParameter('mailer_from');
            if (\is_scalar($param) && (string) $param !== '') {
                $from = (string) $param;
            }
        } catch (\InvalidArgumentException $e) {
            // keep default
        }

        // Try to send confirmation email (best-effort)
        try {
            $emailMessage = (new Email())
                ->from($from)
                ->to($email)
                ->subject('Confirmez votre compte')
                ->text("Merci de confirmer votre compte : $confirmUrl");

            $this->mailer->send($emailMessage);
            // do not call $emailMessage->getMessageId() here — not reliable across transports
            $this->logger->info('Confirmation email dispatched', ['to' => $email]);
        } catch (\Throwable $e) {
            // keep user creation even if mail fails
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

    #[Route('/confirm', name: 'confirm_user', methods: ['GET'])]
    public function confirm(Request $request): JsonResponse
    {
        $token = $request->query->get('token');
        if (!$token) {
            return $this->json(['error' => 'Token manquant'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
        /** @var User|null $user */
        $user = $repo->findOneBy(['confirmationToken' => $token]);

        if (!$user) {
            return $this->json(['error' => 'Token invalide, veuillez vérifier votre boîte mail'], Response::HTTP_BAD_REQUEST);
        }

        if ($user->isConfirmed()) {
            return $this->json(['message' => 'Compte déjà confirmé'], Response::HTTP_OK);
        }

        $user->setIsConfirmed(true);
        $user->setConfirmationToken(null);
        $this->em->flush();

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

        $from = 'noreply@example.com';
        try {
            $param = $this->getParameter('mailer_from');
            if (\is_scalar($param) && (string) $param !== '') {
                $from = (string) $param;
            }
        } catch (\InvalidArgumentException $e) {
            // keep default
        }

        try {
            $emailMessage = (new Email())
                ->from($from)
                ->to($email)
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
