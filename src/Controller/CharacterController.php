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
     * Body: { "title": "...", "description": "...", "templateType": "blank|template1|template2", "layout": {...} }
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
        $layout = isset($data['layout']) && is_array($data['layout']) ? $data['layout'] : null;

        if (!$title) {
            return $this->json(['error' => 'Title is required'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $character = new Character();
        $character->setTitle((string)$title);
        $character->setDescription($description);
        $character->setTemplateType($templateType);
        $character->setOwner($user);

        // if front provided layout, accept it; otherwise resolve server-side from templateType
        if ($layout !== null) {
            $character->setLayout($layout);
        } else {
            // simple server-side mapping for templates (you can replace by service)
            $templates = $this->getAvailableTemplates();
            if ($templateType && isset($templates[$templateType])) {
                $character->setLayout($templates[$templateType]['layout']);
            } else {
                // default empty layout (just placeholders)
                $character->setLayout($this->defaultEmptyLayout());
            }
        }

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

        // Return 201 + object
        return $this->json([
            'id' => $id,
            'title' => $character->getTitle(),
            'description' => $character->getDescription(),
            'templateType' => $character->getTemplateType(),
            'layout' => $character->getLayout(),
        ], Response::HTTP_CREATED);
    }

    private function getAvailableTemplates(): array
    {
        // minimal example mapping; keep in sync with front/src/data/templates.js
        return [
            'template1' => [
                'label' => 'Modèle A',
                'layout' => [
                    'rows' => [
                        [
                            ['id'=>'s1','type'=>'Identité','width'=>200,'content'=>[],'collapsed'=>false],
                            ['id'=>'s2','type'=>'Contact','width'=>200,'content'=>[],'collapsed'=>false],
                            ['id'=>'s3','type'=>'Lore','width'=>400,'content'=>[],'collapsed'=>false],
                            ['id'=>'s4','type'=>'Quêtes','width'=>400,'content'=>[],'collapsed'=>false],
                            ['id'=>'s5','type'=>'NewbiePark','width'=>400,'content'=>[],'collapsed'=>false],
                        ],
                        [
                            ['id'=>'s6','type'=>'empty','width'=>350,'content'=>null,'collapsed'=>true],
                            ['id'=>'s7','type'=>'HautsFaits','width'=>400,'content'=>[],'collapsed'=>false],
                            ['id'=>'s8','type'=>'Talents','width'=>400,'content'=>[],'collapsed'=>false],
                            ['id'=>'s9','type'=>'Qualités','width'=>400,'content'=>[],'collapsed'=>false],
                            ['id'=>'s10','type'=>'empty','width'=>350,'content'=>null,'collapsed'=>true],
                        ],
                        [
                            ['id'=>'s11','type'=>'empty','width'=>400,'content'=>null,'collapsed'=>true],
                            ['id'=>'s12','type'=>'Langues','width'=>200,'content'=>[],'collapsed'=>false],
                            ['id'=>'s13','type'=>'empty','width'=>200,'content'=>null,'collapsed'=>true],
                            ['id'=>'s14','type'=>'Hobbies','width'=>200,'content'=>[],'collapsed'=>false],
                            ['id'=>'s15','type'=>'empty','width'=>400,'content'=>null,'collapsed'=>true],
                        ]
                    ]
                ]
            ],
            // add template2 / template3 if needed
        ];
    }

    private function defaultEmptyLayout(): array
    {
        // fallback: create TOTAL_SLOTS = 15 placeholders with standard widths
        $rows = [];
        $slots = 15;
        $perRow = 5;
        for ($r = 0; $r < ceil($slots / $perRow); $r++) {
            $row = [];
            for ($c = 0; $c < $perRow; $c++) {
                $idx = $r * $perRow + $c + 1;
                $row[] = [
                    'id' => 's'.$idx,
                    'type' => 'empty',
                    'width' => 295,
                    'content' => null,
                    'collapsed' => true,
                ];
            }
            $rows[] = $row;
        }
        return ['rows' => $rows];
    }
}
