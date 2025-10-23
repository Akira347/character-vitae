<?php

// src/Repository/SectionRepository.php
declare(strict_types=1);

namespace App\Repository;

use App\Entity\Character;
use App\Entity\Section;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Section>
 *
 * @method Section|null find($id, $lockMode = null, $lockVersion = null)
 * @method Section|null findOneBy(array<string,mixed> $criteria = [], array<string,string>|null $orderBy = null)
 * @method Section[] findAll()
 * @method Section[] findBy(array<string,mixed> $criteria = [], array<string,string>|null $orderBy = null, int|null $limit = null, int|null $offset = null)
 */
final class SectionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Section::class);
    }

    /**
     * Retourne les sections d'un Character ordonnées par position asc.
     *
     * @return Section[]
     */
    public function findByCharacterOrdered(Character $character): array
    {
        $qb = $this->createQueryBuilder('s')
            ->andWhere('s.character = :char')
            ->setParameter('char', $character)
            ->orderBy('s.position', 'ASC')
            ->getQuery();

        /** @var Section[] $res */
        $res = $qb->getResult();

        return $res;
    }

    /**
     * Retourne une section par character & serverId si existant.
     */
    public function findOneByCharacterAndServerId(Character $character, string $serverId): ?Section
    {
        $qb = $this->createQueryBuilder('s')
            ->andWhere('s.character = :char')
            ->andWhere('s.serverId = :sid')
            ->setParameter('char', $character)
            ->setParameter('sid', $serverId)
            ->setMaxResults(1)
            ->getQuery();

        /** @var Section|null $res */
        $res = $qb->getOneOrNullResult();

        return $res;
    }

    /**
     * Retourne les sections d'un Character filtrées par types.
     *
     * @param string[] $types
     *
     * @return Section[]
     */
    public function findByCharacterAndTypes(Character $character, array $types): array
    {
        if (\count($types) === 0) {
            return [];
        }

        $qb = $this->createQueryBuilder('s')
            ->andWhere('s.character = :char')
            ->andWhere('s.type IN (:types)')
            ->setParameter('char', $character)
            ->setParameter('types', $types)
            ->orderBy('s.position', 'ASC')
            ->getQuery();

        /** @var Section[] $res */
        $res = $qb->getResult();

        return $res;
    }
}
