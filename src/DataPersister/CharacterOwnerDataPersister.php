<?php

// src/DataPersister/CharacterOwnerDataPersister.php
declare(strict_types=1);

namespace App\DataPersister;

use ApiPlatform\Core\DataPersister\ContextAwareDataPersisterInterface;
use App\Entity\Character;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Security\Core\Security;

final class CharacterOwnerDataPersister implements ContextAwareDataPersisterInterface
{
    public function __construct(
        private ContextAwareDataPersisterInterface $decorated,
        private EntityManagerInterface $em,
        private Security $security,
        private LoggerInterface $logger,
    ) {
    }

    public function supports($data, array $context = []): bool
    {
        return $data instanceof Character;
    }

    public function persist($data, array $context = [])
    {
        /** @var Character $data */
        $user = $this->security->getUser();
        if (!$user) {
            throw new \RuntimeException('Unauthenticated');
        }

        if ($data->getOwner() === null) {
            $data->setOwner($user);
        } else {
            // optionally ensure owner matches current user on update
            if ($data->getOwner()->getId() !== $user->getId()) {
                $this->logger->warning('Attempt to set different owner on Character', [
                    'user' => $user->getId(),
                    'owner' => $data->getOwner()->getId(),
                ]);
                throw new \RuntimeException('Unauthorized owner change');
            }
        }

        // delegate actual persistence to decorated persister or persist directly
        if ($this->decorated) {
            return $this->decorated->persist($data, $context);
        }

        $this->em->persist($data);
        $this->em->flush();

        return $data;
    }

    public function remove($data, array $context = [])
    {
        if ($this->decorated) {
            return $this->decorated->remove($data, $context);
        }

        $this->em->remove($data);
        $this->em->flush();
    }
}
