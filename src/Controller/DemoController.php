<?php
// src/Controller/DemoController.php
declare(strict_types=1);

namespace App\Controller;

use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

final class DemoController extends AbstractController
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    /**
     * Endpoint public pour la démo (lecture seule).
     *
     * Utilise un chemin qui n'entre pas en collision avec ApiPlatform.
     */
    #[Route('/apip/character/demo', name: 'apip_demo_character', methods: ['GET'])]
    public function demoCharacter(): JsonResponse
    {
        $param = $this->getParameter('kernel.project_dir');

        // si kernel.project_dir n'est pas une string, retourner le fallback embarqué
        if (!\is_string($param)) {
            $this->logger->warning('kernel.project_dir parameter is not a string', ['value' => $param]);
            return $this->json($this->embeddedDemo());
        }

        $path = $param . '/data/demo-character.json';

        if (!\file_exists($path)) {
            $this->logger->warning('Demo character file not found', ['path' => $path]);
            return $this->json($this->embeddedDemo());
        }

        $content = \file_get_contents($path);
        if ($content === false) {
            $this->logger->warning('Failed to read demo file', ['path' => $path]);
            return $this->json($this->embeddedDemo());
        }

        try {
            $decoded = \json_decode($content, true, 512, \JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            $this->logger->warning('Invalid demo JSON', ['exception' => $e->getMessage()]);
            return $this->json($this->embeddedDemo());
        }

        return $this->json($decoded);
    }

    /**
     * Demo embarquée en fallback (forme attendue par le front).
     *
     * @return array<string,mixed>
     */
    private function embeddedDemo(): array
    {
        return [
            'id' => 'demo',
            'title' => 'Guerrier de la data (démo)',
            'templateType' => 'template1',
            'description' => 'Fiche de démonstration publique (fallback)',
            'layout' => [
                'rows' => [
                    [
                        ['id' => 's1', 'type' => 'Identité', 'width' => 300, 'content' => [], 'isCollapsed' => true],
                        ['id' => 's2', 'type' => 'Contact', 'width' => 300, 'content' => [], 'isCollapsed' => true],
                        ['id' => 's3', 'type' => 'Lore', 'width' => 320, 'content' => [], 'isCollapsed' => true],
                    ],
                    [
                        ['id' => 's4', 'type' => 'Quêtes', 'width' => 480, 'content' => [], 'isCollapsed' => true],
                        ['id' => 's5', 'type' => 'Talents', 'width' => 240, 'content' => [], 'isCollapsed' => true],
                        ['id' => 's6', 'type' => 'HautsFaits', 'width' => 240, 'content' => [], 'isCollapsed' => true],
                    ],
                ],
            ],
        ];
    }
}
