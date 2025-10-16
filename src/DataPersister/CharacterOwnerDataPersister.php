<?php
declare(strict_types=1);

namespace App\DataPersister;

use ApiPlatform\Core\DataPersister\ContextAwareDataPersisterInterface;
use App\Entity\Character;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Security\Core\Security;

final class CharacterOwnerDataPersister implements ContextAwareDataPersisterInterface
{
    public function __construct(private EntityManagerInterface $em, private Security $security)
    {
    }

    public function supports($data, array $context = []): bool
    {
        return $data instanceof Character;
    }

    /**
     * @param Character $data
     */
    public function persist($data, array $context = [])
    {
        // Si création et owner manquant, lier l'user courant
        if (null === $data->getOwner()) {
            $user = $this->security->getUser();
            if ($user !== null) {
                $data->setOwner($user);
            }
        }

        $this->em->persist($data);
        $this->em->flush();

        return $data;
    }

    public function remove($data, array $context = [])
    {
        $this->em->remove($data);
        $this->em->flush();
    }
}
