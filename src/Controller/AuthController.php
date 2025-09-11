<?php

// src/Controller/AuthController.php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Bridge\Twig\Mime\TemplatedEmail;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\ConstraintViolationListInterface;

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private SerializerInterface $serializer,
        private MailerInterface $mailer,
        private UrlGeneratorInterface $urlGenerator,
        private string $frontendBaseUrl = 'http://localhost:5173' // inject via env if needed
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
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        $rawPassword = $data['password'] ?? null;
        $fullName = $data['fullname'] ?? null;

        // basic input checks
        $violations = $this->validator->validate($email, [
            new Assert\NotBlank(),
            new Assert\Email(),
        ]);
        if (count($violations) > 0) {
            return $this->json(['error' => 'Invalid email'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $pwViolations = $this->validator->validate($rawPassword, [
            new Assert\NotBlank(),
            new Assert\Length(['min' => 8, 'minMessage' => 'Le mot de passe doit faire au moins {{ limit }} caractères.']),
        ]);
        if (count($pwViolations) > 0) {
            return $this->json(['error' => 'Password too short'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // check existing user
        $repo = $this->em->getRepository(User::class);
        if ($repo->findOneBy(['email' => $email])) {
            return $this->json(['error' => 'Email already used'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($email);
        if ($fullName) {
            // optionally parse fullname into first/last
            $user->setFirstName($fullName);
        }
        $user->setRoles(['ROLE_USER']);

        $hashed = $this->passwordHasher->hashPassword($user, $rawPassword);
        $user->setPassword($hashed);

        // entity validation (email constraints etc.)
        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $payload = $this->serializer->serialize($errors, 'json');
            return new JsonResponse($payload, Response::HTTP_UNPROCESSABLE_ENTITY, [], true);
        }

        // generate confirmation token
        $token = bin2hex(random_bytes(32));
        $user->setConfirmationToken($token);
        $user->setIsConfirmed(false);

        $this->em->persist($user);
        $this->em->flush();

        // send confirmation email
        $confirmUrl = rtrim($this->frontendBaseUrl, '/') . '/confirm?token=' . $token;
        $emailMessage = (new TemplatedEmail())
            ->from('no-reply@charactervitae.local')
            ->to($user->getEmail())
            ->subject('Confirmez votre adresse e-mail')
            ->htmlTemplate('emails/confirmation.html.twig')
            ->context([
                'confirmUrl' => $confirmUrl,
                'user' => $user,
            ]);

        $this->mailer->send($emailMessage);

        return $this->json(
            ['id' => $user->getId(), 'email' => $user->getEmail(), 'message' => 'Vérifiez votre boîte mail pour confirmer votre compte.'],
            Response::HTTP_CREATED
        );
    }

    #[Route('/confirm', name: 'confirm_user', methods: ['GET'])]
    public function confirm(Request $request): JsonResponse
    {
        $token = $request->query->get('token');
        if (!$token) {
            return $this->json(['error' => 'Token manquant'], Response::HTTP_BAD_REQUEST);
        }

        $repo = $this->em->getRepository(User::class);
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

        // Sérialisation simple — adapte aux groupes si besoin
        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ]);
    }
}
