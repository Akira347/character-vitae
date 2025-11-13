<?php

// tests/Repository/SectionRepositoryTest.php
declare(strict_types=1);

namespace App\Tests\Repository;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Entity\Character;
use App\Entity\Section;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

final class SectionRepositoryTest extends ApiTestCase
{
    private EntityManagerInterface $em;

    protected function setUp(): void
    {
        parent::setUp();
        static::bootKernel();

        // PHPStan-friendly annotation
        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->em = $em;
    }

    public function testSectionEntityPersists(): void
    {
        // create a test user to be owner (owner is not null)
        $user = new User();
        $user->setEmail('repo-test@example.com');
        $user->setFirstName('Repo');
        $user->setLastName('Test');
        $user->setRoles(['ROLE_USER']);
        // If User requires password hashing, set a raw value or use hasher from container
        $user->setPassword('notused');

        $this->em->persist($user);

        $character = new Character();
        $character->setTitle('RepoTestCharacter');
        $character->setOwner($user); // **important**
        $this->em->persist($character);
        $this->em->flush();

        $this->assertNotNull($character->getId());

        $section = new Section();
        $section->setCharacter($character);
        $section->setType('Identité');
        $section->setContent(['nom' => 'Test']);
        $section->setWidth(300);
        $section->setPosition(1);
        $section->setIsCollapsed(false);

        $this->em->persist($section);
        $this->em->flush();

        $repo = $this->em->getRepository(Section::class);
        $found = $repo->find($section->getId());
        $this->assertNotNull($found);

        $this->assertSame('Identité', $found->getType());
        $this->assertSame(300, $found->getWidth());

        $foundCharacter = $found->getCharacter();
        $this->assertNotNull($foundCharacter);
        $this->assertSame($character->getId(), $foundCharacter->getId());

        $this->assertFalse($found->isCollapsed());
    }
}
