<?php
// src/Controller/CharacterController.php

namespace App\Controller;

use App\Entity\Character;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class CharacterController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ValidatorInterface $validator,
        private LoggerInterface $logger
    ) {}

    /**
     * Create new character
     *
     * POST /api/characters
     * Body: { "title": "...", "description": "...", "templateType": "blank|template1|template2" }
     */
    #[Route('/characters', name: 'characters_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // require authenticated user
        /** @var User|null $user */
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'Unauthenticated'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $this->logger->warning('Character create: invalid JSON', ['exception' => $e->getMessage()]);
            return $this->json(['error' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        $title = isset($data['title']) && is_scalar($data['title']) ? trim((string)$data['title']) : null;
        $description = isset($data['description']) && is_scalar($data['description']) ? (string)$data['description'] : null;
        $templateType = isset($data['templateType']) && is_scalar($data['templateType']) ? (string)$data['templateType'] : null;

        $character = new Character();
        $character->setTitle((string)$title);
        $character->setDescription($description);
        $character->setTemplateType($templateType);
        $character->setOwner($user);

        // validate
        $violations = $this->validator->validate($character);
        if (count($violations) > 0) {
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
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($character);
        $this->em->flush();

        $id = $character->getId();
        $location = $this->generateUrl('/dashboard/characters/{$id}', ['id' => $id], 0);

        // Return 201 + object
        return $this->json([
            'id' => $id,
            'title' => $character->getTitle(),
            'description' => $character->getDescription(),
            'templateType' => $character->getTemplateType(),
        ], Response::HTTP_CREATED, ['Location' => $location]);
    }
}
