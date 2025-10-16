<?php
// src/Controller/DemoController.php
declare(strict_types=1);

namespace App\Controller;

use App\Entity\Character;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

final class DemoController extends AbstractController
{
    public function __construct(
        private LoggerInterface $logger,
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * Endpoint public pour la démo (lecture seule).
     *
     * Recherche l'utilisateur de démonstration et renvoie sa fiche "Demo".
     */
    #[Route('/apip/character/demo', name: 'apip_demo_character', methods: ['GET'])]
    public function demoCharacter(): JsonResponse
    {
        // email de la demo — configurable si tu veux l'extraire d'un paramètre d'env
        $demoEmail = 'e.fonquernie@gmail.com';

        try {
            /** @var User|null $user */
            $user = $this->em->getRepository(User::class)->findOneBy(['email' => $demoEmail]);

            if ($user instanceof User) {
                // prefer title 'Demo' if exists
                $character = $this->em->getRepository(Character::class)->findOneBy(['owner' => $user, 'title' => 'Demo']);

                if (!$character) {
                    // fallback : first character of that user
                    $character = $this->em->getRepository(Character::class)->findOneBy(['owner' => $user]);
                }

                if ($character instanceof Character) {
                    return $this->json([
                        'id' => $character->getId(),
                        'title' => $character->getTitle(),
                        'description' => $character->getDescription(),
                        'templateType' => $character->getTemplateType(),
                        'layout' => $character->getLayout() ?? ['rows' => []],
                        'avatar' => $character->getAvatar(),
                    ]);
                }
            }
        } catch (\Throwable $e) {
            $this->logger->warning('Demo lookup failed', ['exception' => $e->getMessage()]);
            // fall through to embedded demo
        }

        // Fallback embarqué
        return $this->json($this->embeddedDemo());
    }

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
