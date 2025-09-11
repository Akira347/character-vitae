<?php

// src/Controller/AuthController.php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private SerializerInterface $serializer,
        private MailerInterface $mailer,
        private string $frontendUrl, // injecté via services.yaml
    ) {
    }

    /**
     * Register a new user.
     *
     * POST /api/register
     * Body: { "email": "...", "password": "...", "fullname": "..." }
     */
    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        // Request::toArray() renvoie array et lancera une exception si le JSON est invalide
        try {
            /** @var array<string,mixed> $data */
            $data = $request->toArray();
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        $email = isset($data['email']) && \is_string($data['email']) ? $data['email'] : null;
        $plainPassword = isset($data['password']) && \is_string($data['password']) ? $data['password'] : null;
        $fullname = isset($data['fullname']) && \is_string($data['fullname']) ? $data['fullname'] : null;

        if (!$email || !$plainPassword) {
            return $this->json(['error' => 'Missing credentials'], Response::HTTP_BAD_REQUEST);
        }

        // check existing user
        $repo = $this->em->getRepository(User::class);
        if ($repo->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'Email already used'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($email);
        $user->setRoles(['ROLE_USER']);
        $user->setIsConfirmed(false); // s'assurer de l'état initial (méthode existante sur l'entité)

        $hashed = $this->passwordHasher->hashPassword($user, $plainPassword);
        $user->setPassword($hashed);

        // fill names if present (si tu veux splitter fullname)
        if ($fullname !== null) {
            // exemple simple : essayer de splitter en first/last
            $parts = \array_values(\array_filter(\array_map('trim', \explode(' ', $fullname))));
            $user->setFirstName($parts[0] ?? null);
            $user->setLastName($parts[1] ?? null);
        }

        // validate entity
        // Générer un token de confirmation
        $token = \bin2hex(\random_bytes(16));
        $user->setConfirmationToken($token);

        $errors = $this->validator->validate($user);
        if (\count($errors) > 0) {
            $payload = $this->serializer->serialize($errors, 'json');

            return new JsonResponse($payload, Response::HTTP_UNPROCESSABLE_ENTITY, [], true);
        }

        $this->em->persist($user);
        $this->em->flush();

        // Send confirmation email
        try {
            $confirmUrl = \rtrim($this->frontendUrl, '/').'/confirm?token='.\urlencode($token);
            $recipient = (string) $user->getEmail();

            $emailMessage = (new Email())
                ->from('noreply@example.com')
                ->to($recipient)
                ->subject('Confirmez votre compte')
                ->text(\sprintf('Merci de confirmer votre compte : %s', $confirmUrl));

            $this->mailer->send($emailMessage);
        } catch (\Throwable $e) {
            // Ne pas empêcher la création de l'utilisateur si l'envoi échoue,
            // mais on peut logguer. Ici on renvoie quand même 201.
        }

        // return minimal user payload
        return $this->json(
            ['id' => $user->getId(), 'email' => $user->getEmail()],
            Response::HTTP_CREATED
        );
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
        if (!$token) {
            return $this->json(['error' => 'Token manquant'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
        /** @var User|null $user */
        $user = $repo->findOneBy(['confirmationToken' => $token]);
        if (!$user) {
            return $this->json(['error' => 'Token invalide'], Response::HTTP_BAD_REQUEST);
        }

        $user->setIsConfirmed(true);
        $user->setConfirmationToken(null);
        $this->em->flush();

        // Option: redirect to frontend confirmation page
        return $this->json(['message' => 'Compte confirmé. Vous pouvez maintenant vous connecter.']);
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
