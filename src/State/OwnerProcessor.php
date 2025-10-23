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
 * Processor qui ne fait que la vérification des Sections.
 * La création/persistence des Character est gérée par CharacterController.
 *
 * @implements ProcessorInterface<mixed, mixed>
 */
final class OwnerProcessor implements ProcessorInterface
{
    /**
     * Security object is accepted as a generic object here to avoid hard dependency
     * problems during container compilation in some environments. It must implement getUser(): ?User.
     */
    private ?object $security;

    public function __construct(?object $security, private LoggerInterface $logger)
    {
        $this->security = $security;
    }

    /**
     * Process incoming data (called by API Platform).
     *
     * @param array<string,mixed> $uriVariables
     * @param array<string,mixed> $context
     */
    public function process(mixed $data, ?Operation $operation = null, array $uriVariables = [], array $context = []): mixed
    {
        // safe retrieval of user: only call getUser() if the provided security object supports it
        $user = null;
        if ($this->security !== null && \method_exists($this->security, 'getUser')) {
            $maybeUser = $this->security->getUser();
            if ($maybeUser instanceof User) {
                $user = $maybeUser;
            }
        }

        $this->logger->debug('OwnerProcessor (lite) called', [
            'class' => \is_object($data) ? \get_class($data) : \gettype($data),
            'user' => $user?->getId(),
        ]);

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

            if ($owner->getId() !== $user->getId()) {
                throw new \RuntimeException('Not allowed to modify section of this character.');
            }
        }

        // nothing to persist here, we only validate/inspect
        return $data;
    }

    /**
     * @param array<string,mixed> $context
     */
    public function supports(mixed $data, array $context = []): bool
    {
        return $data instanceof Section;
    }
}
