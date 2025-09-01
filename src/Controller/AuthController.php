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

#[Route('/api', name: 'api_')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private SerializerInterface $serializer,
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
        $data = \json_decode($request->getContent(), true);
        if (!isset($data['email'], $data['password'])) {
            return $this->json(['error' => 'Missing credentials'], Response::HTTP_BAD_REQUEST);
        }

        // check existing user
        $repo = $this->em->getRepository(User::class);
        if ($repo->findOneBy(['email' => $data['email']])) {
            return $this->json(['error' => 'Email already used'], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles(['ROLE_USER']);

        $hashed = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashed);

        // validate entity
        $errors = $this->validator->validate($user);
        if (\count($errors) > 0) {
            $payload = $this->serializer->serialize($errors, 'json');

            return new JsonResponse($payload, Response::HTTP_UNPROCESSABLE_ENTITY, [], true);
        }

        $this->em->persist($user);
        $this->em->flush();

        // return minimal user payload
        return $this->json(
            ['id' => $user->getId(), 'email' => $user->getEmail()],
            Response::HTTP_CREATED
        );
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
