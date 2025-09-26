<?php

// src/Controller/CharacterController.php
declare(strict_types=1);

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
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Create new character.
     *
     * POST /api/characters
     * Body: { "title": "...", "description": "...", "templateType": "...", "layout": {...} }
     */
    #[Route('/characters', name: 'characters_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
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

        /** @var array<string,mixed> $data */
        $title = isset($data['title']) && \is_scalar($data['title']) ? \trim((string) $data['title']) : null;
        $description = isset($data['description']) && \is_scalar($data['description']) ? (string) $data['description'] : null;
        $templateType = isset($data['templateType']) && \is_scalar($data['templateType']) ? (string) $data['templateType'] : null;

        if (!$title) {
            return $this->json(['error' => 'Title is required'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $character = new Character();
        $character->setTitle($title);
        $character->setDescription($description);
        $character->setTemplateType($templateType);
        $character->setOwner($user);

        // handle layout: either provided or derived from template
        if (isset($data['layout']) && \is_array($data['layout'])) {
            /** @var array<string,mixed> $rawLayout */
            $rawLayout = $data['layout'];
            $layout = $this->normalizeLayoutForEntity($rawLayout);
            $character->setLayout($layout);
        } else {
            $templates = $this->loadTemplates();
            $selected = $templateType && isset($templates[$templateType]) ? $templates[$templateType] : ($templates['blank'] ?? null);
            $layoutSource = $selected && isset($selected['layout']) ? $selected['layout'] : $this->defaultEmptyLayout();
            // layoutSource might be mixed; normalizeLayoutForEntity guards on type.
            $layout = $this->normalizeLayoutForEntity($layoutSource);
            $character->setLayout($layout);
        }

        // validate
        $violations = $this->validator->validate($character);
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
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($character);
        $this->em->flush();

        $id = $character->getId();

        return $this->json([
            'id' => $id,
            'title' => $character->getTitle(),
            'description' => $character->getDescription(),
            'templateType' => $character->getTemplateType(),
            'layout' => $character->getLayout(),
        ], Response::HTTP_CREATED);
    }

    /**
     * Normalize layout so that it matches the expected entity shape.
     *
     * Accepts mixed (templates or provided payload may be loosely typed).
     *
     * @param mixed $raw
     *
     * @return array<string,mixed>
     */
    private function normalizeLayoutForEntity(mixed $raw): array
    {
        $out = ['rows' => []];

        if (!\is_array($raw)) {
            return $out;
        }

        // $raw is array — we expect ['rows' => [...]] but guard thoroughly
        if (!isset($raw['rows']) || !\is_array($raw['rows'])) {
            return $out;
        }

        $seen = [];
        foreach ($raw['rows'] as $rIdx => $row) {
            if (!\is_array($row)) {
                continue;
            }
            $newRow = [];
            foreach ($row as $cIdx => $cell) {
                if (!\is_array($cell)) {
                    $cell = [];
                }

                $rawId = isset($cell['id']) && \is_string($cell['id']) ? $cell['id'] : 's'.($rIdx * 10 + $cIdx);
                $id = $rawId;
                $suffix = 0;
                while (isset($seen[$id])) {
                    $id = $rawId.'-'.(++$suffix);
                }
                $seen[$id] = true;

                $newCell = [
                    'id' => $id,
                    'type' => isset($cell['type']) && \is_string($cell['type']) ? $cell['type'] : 'empty',
                    'width' => $cell['width'] ?? null,
                    'content' => \array_key_exists('content', $cell) ? $cell['content'] : (isset($cell['type']) && $cell['type'] === 'empty' ? null : []),
                    'isCollapsed' => isset($cell['isCollapsed']) ? (bool) $cell['isCollapsed'] : (isset($cell['collapsed']) ? (bool) $cell['collapsed'] : true),
                ];

                $newRow[] = $newCell;
            }
            $out['rows'][] = $newRow;
        }

        return $out;
    }

    /**
     * Charge et normalise les templates depuis data/templates.json.
     *
     * Retourne une map clé => template (chaque template est un tableau associatif
     * dont les clés sont des strings et les valeurs mixtes).
     *
     * @return array<string, array<string,mixed>>
     */
    private function loadTemplates(): array
    {
        $param = $this->getParameter('kernel.project_dir');

        if (!\is_string($param)) {
            $this->logger->warning('kernel.project_dir parameter is not a string', ['value' => $param]);

            return [];
        }

        $projectDir = $param;
        $path = $projectDir . '/data/templates.json';

        if (!\file_exists($path)) {
            $this->logger->warning('templates.json not found', ['path' => $path]);

            return [];
        }

        $content = \file_get_contents($path);
        if ($content === false) {
            $this->logger->warning('Failed to read templates.json', ['path' => $path]);

            return [];
        }

        try {
            $decoded = \json_decode($content, true, 512, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            $this->logger->warning('Invalid JSON in templates.json', ['exception' => $e->getMessage()]);

            return [];
        }

        if (!\is_array($decoded)) {
            return [];
        }

        /** @var array<string, array<string,mixed>> $map */
        $map = [];

        // detect indexed or associative structure
        $isIndexed = \array_values($decoded) === $decoded;

        if ($isIndexed) {
            foreach ($decoded as $item) {
                if (!\is_array($item)) {
                    continue;
                }
                if (!isset($item['key']) || !\is_string($item['key'])) {
                    continue;
                }
                // cast to array<string,mixed> for phpstan
                /** @var array<string,mixed> $typedItem */
                $typedItem = (array) $item;
                $map[$typedItem['key']] = $typedItem;
            }
        } else {
            foreach ($decoded as $key => $item) {
                if (!\is_string($key) || !\is_array($item)) {
                    continue;
                }
                /** @var array<string,mixed> $typedItem */
                $typedItem = (array) $item;
                if (!isset($typedItem['key']) || !\is_string($typedItem['key'])) {
                    $typedItem['key'] = $key;
                }
                $map[$key] = $typedItem;
            }
        }

        // normalize layout for each template (guarantee types inside)
        foreach ($map as $tkey => &$tpl) {
            if (!isset($tpl['layout']) || !\is_array($tpl['layout'])) {
                $tpl['layout'] = ['rows' => []];
            }
            if (!isset($tpl['layout']['rows']) || !\is_array($tpl['layout']['rows'])) {
                $tpl['layout']['rows'] = [];
            }

            $seen = [];
            foreach ($tpl['layout']['rows'] as $rIdx => &$row) {
                if (!\is_array($row)) {
                    $row = [];
                }
                foreach ($row as $cIdx => &$cell) {
                    if (!\is_array($cell)) {
                        $cell = [];
                    }
                    $rawId = isset($cell['id']) && \is_string($cell['id']) ? $cell['id'] : 's'.($rIdx * 10 + $cIdx);
                    $id = $rawId;
                    $suffix = 0;
                    while (isset($seen[$id])) {
                        ++$suffix;
                        $id = $rawId.'-'.$suffix;
                    }
                    $seen[$id] = true;
                    $cell['id'] = $id;
                    $cell['type'] = isset($cell['type']) && \is_string($cell['type']) ? $cell['type'] : 'empty';
                    if (!\array_key_exists('content', $cell)) {
                        $cell['content'] = $cell['type'] === 'empty' ? null : [];
                    }
                    $cell['isCollapsed'] = isset($cell['isCollapsed'])
                        ? (bool) $cell['isCollapsed']
                        : (isset($cell['collapsed']) ? (bool) $cell['collapsed'] : true);
                    if (isset($cell['collapsed'])) {
                        unset($cell['collapsed']);
                    }
                }
            }
            unset($cell, $row);

            // cast template to array<string,mixed> explicitly for phpstan
            /** @var array<string,mixed> $typedTpl */
            $typedTpl = (array) $tpl;
            $tpl = $typedTpl;
        }
        unset($tpl);

        return $map;
    }

    /**
     * @return array<mixed>
     */
    private function defaultEmptyLayout(): array
    {
        $rows = [];
        $slots = 15;
        $perRow = 5;
        for ($r = 0; $r < (int) \ceil($slots / $perRow); ++$r) {
            $row = [];
            for ($c = 0; $c < $perRow; ++$c) {
                $idx = $r * $perRow + $c + 1;
                $row[] = [
                    'id' => 's'.$idx,
                    'type' => 'empty',
                    'width' => 295,
                    'content' => null,
                    'isCollapsed' => true,
                ];
            }
            $rows[] = $row;
        }

        return ['rows' => $rows];
    }
}
