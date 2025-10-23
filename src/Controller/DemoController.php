<?php

// src/Controller/DemoController.php
declare(strict_types=1);

namespace App\Controller;

use App\Entity\Character;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

final class DemoController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private LoggerInterface $logger,
        private ?string $demoEmail = null, // nullable : évite les warnings si param non fourni
    ) {
    }

    #[Route('/apip/character/demo', name: 'apip_demo_character', methods: ['GET'])]
    public function demoCharacter(): JsonResponse
    {
        if ($this->demoEmail === null || $this->demoEmail === '') {
            $this->logger->warning('Demo email not configured');

            return $this->json($this->embeddedDemo());
        }

        $userRepo = $this->em->getRepository(\App\Entity\User::class);
        $characterRepo = $this->em->getRepository(Character::class);

        $demoUser = $userRepo->findOneBy(['email' => $this->demoEmail]);

        if ($demoUser instanceof \App\Entity\User) {
            // Prefer exact title 'Demo' (case-insensitive). Use query builder to be precise.
            $qb = $this->em->createQueryBuilder();
            $qb->select('c')
                ->from(Character::class, 'c')
                ->where('c.owner = :owner')
                ->andWhere($qb->expr()->eq('LOWER(c.title)', ':demoTitle'))
                ->setParameter('owner', $demoUser)
                ->setParameter('demoTitle', \mb_strtolower('Demo'))
                ->setMaxResults(1)
                ->orderBy('c.id', 'ASC');

            $demoChar = $qb->getQuery()->getOneOrNullResult();

            // fallback: first character of the user
            if (!$demoChar) {
                $demoChar = $characterRepo->findOneBy(['owner' => $demoUser], ['id' => 'ASC']);
            }

            if ($demoChar instanceof Character) {
                return $this->json([
                    'id' => $demoChar->getId(),
                    'title' => $demoChar->getTitle(),
                    'description' => $demoChar->getDescription(),
                    'templateType' => $demoChar->getTemplateType(),
                    'layout' => $demoChar->getLayout(),
                    'avatar' => $demoChar->getAvatar(),
                ]);
            }
        }

        $this->logger->warning('Demo character not found for email', ['email' => $this->demoEmail]);

        return $this->json($this->embeddedDemo());
    }

    /**
     * Demo embarquée en fallback (forme attendue par le front).
     *
     * @return array<string, mixed>
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
                ],
            ],
        ];
    }
}
