<?php
// src/State/OwnerProcessor.php
declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Character;
use App\Entity\Section;
use App\Entity\User;
use Psr\Log\LoggerInterface;

/**
 * Processor simple qui :
 *  - assigne l'owner courant lors de la création d'un Character si absent
 *  - empêche la modification/création de Section si l'utilisateur n'est pas propriétaire du Character
 *
 * @implements ProcessorInterface<mixed, mixed>
 */
final class OwnerProcessor implements ProcessorInterface
{
    /**
     * Security object is accepted as a generic object here to avoid hard dependency problems
     * during container compilation in some environments. It must implement getUser(): ?User.
     *
     * @var object|null
     */
    private ?object $security;

    public function __construct(?object $security, private LoggerInterface $logger)
    {
        $this->security = $security;
    }

    /**
     * @param mixed $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        $user = null;
        if ($this->security !== null && method_exists($this->security, 'getUser')) {
            $user = $this->security->getUser();
        }

        // Pour Character : si on crée (owner null) -> affecte owner = user courant
        if ($data instanceof Character) {
            if ($user instanceof User && $data->getOwner() === null) {
                $data->setOwner($user);
                $this->logger->debug('OwnerProcessor: assigned owner to Character', [
                    'userId' => $user->getId(),
                ]);
            }
        }

        // Pour Section : vérifier que le user est bien propriétaire du Character lié
        if ($data instanceof Section) {
            $character = $data->getCharacter();
            if ($character === null) {
                throw new \RuntimeException('Section must be linked to a Character.');
            }

            $owner = $character->getOwner();
            if (!$owner instanceof User) {
                throw new \RuntimeException('Character has no owner.');
            }

            if (!$user instanceof User) {
                throw new \RuntimeException('Unauthenticated user cannot modify sections.');
            }

            $ownerId = $owner->getId();
            $userId = $user->getId();

            if ($ownerId === null || $userId === null || $ownerId !== $userId) {
                throw new \RuntimeException('Not allowed to modify section of this character.');
            }
        }

        // On retourne l'entité modifiée (API Platform poursuivra la persistance)
        return $data;
    }

    /**
     * @param mixed $data
     * @param array<mixed> $context
     */
    public function supports(mixed $data, array $context = []): bool
    {
        return $data instanceof Character || $data instanceof Section;
    }
}
