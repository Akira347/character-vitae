<?php

// src/DataPersister/SectionDataPersister.php
declare(strict_types=1);

namespace App\DataPersister;

use ApiPlatform\Core\DataPersister\ContextAwareDataPersisterInterface;
use App\Entity\Section;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Security\Core\Security;

final class SectionDataPersister implements ContextAwareDataPersisterInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
        private LoggerInterface $logger,
    ) {
    }

    public function supports($data, array $context = []): bool
    {
        return $data instanceof Section;
    }

    /**
     * Persist a Section after basic ownership checks.
     *
     * @param Section $data
     */
    public function persist($data, array $context = [])
    {
        $user = $this->security->getUser();

        $character = $data->getCharacter();
        if (!$character) {
            throw new \RuntimeException('Section must be attached to a Character.');
        }

        // Only owner can create/update
        if (!$user || $character->getOwner()?->getId() !== $user->getId()) {
            $this->logger->warning('Unauthorized section persist attempt', [
                'user' => $user ? $user->getId() : null,
                'character' => $character->getId(),
            ]);
            throw new \RuntimeException('Unauthorized');
        }

        // set timestamps
        $data->setUpdatedAt(new \DateTimeImmutable());

        $this->em->persist($data);
        $this->em->flush();

        return $data;
    }

    public function remove($data, array $context = [])
    {
        $user = $this->security->getUser();

        $character = $data->getCharacter();
        if (!$character || !$user || $character->getOwner()?->getId() !== $user->getId()) {
            $this->logger->warning('Unauthorized section delete attempt', [
                'user' => $user ? $user->getId() : null,
                'character' => $character ? $character->getId() : null,
            ]);
            throw new \RuntimeException('Unauthorized');
        }

        $this->em->remove($data);
        $this->em->flush();
    }
}
