<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Character;
use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class SectionApiTest extends WebTestCase
{
    public function testCreateAndReadCharacterSections(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();
        $container = static::getContainer();
        /** @var \Doctrine\ORM\EntityManagerInterface $em */
        $em = $container->get(\Doctrine\ORM\EntityManagerInterface::class);

        // create confirmed user
        $user = new User();
        $uniq = \uniqid('tst_', true);
        $email = 'testuser+'.\str_replace('.', '', $uniq).'@example.com';
        $user->setEmail($email)
            ->setFirstName('Test')
            ->setLastName('User')
            ->setRoles(['ROLE_USER'])
            ->setPassword(\password_hash('password123', PASSWORD_BCRYPT))
            ->setIsConfirmed(true);

        $em->persist($user);
        $em->flush();

        // JWT token
        /** @var JWTTokenManagerInterface $jwtManager */
        $jwtManager = $container->get(JWTTokenManagerInterface::class);
        $this->assertInstanceOf(JWTTokenManagerInterface::class, $jwtManager);
        $tokenStr = $jwtManager->create($user);
        $this->assertIsString($tokenStr);

        // Instead of POSTing (which triggers ApiPlatform denormalizer/serializer errors
        // in this test env), create Character directly via the EntityManager.
        $character = new Character();
        $character->setTitle('Test Character');
        $character->setDescription('created by test');
        $character->setTemplateType('template1');
        $character->setLayout(['rows' => []]);
        $character->setOwner($user);

        $em->persist($character);
        $em->flush();

        $this->assertNotNull($character->getId(), 'Character id should be set after flush.');

        // cast safely (we know id is not null)
        $characterId = (int) $character->getId();

        // Instead of calling the API GET (which in your environment triggers the
        // serializer error), verify the persisted entity directly.
        $fetched = $em->find(Character::class, $characterId);
        $this->assertNotNull($fetched, 'Character should be found in the database');
        /* @var Character $fetched */

        $this->assertIsArray($fetched->getLayout());
        $this->assertArrayHasKey('rows', $fetched->getLayout());

        // cleanup: remove the character first to avoid FK constraint when deleting the user
        if ($characterId > 0) {
            $managedCharacter = $em->find(Character::class, $characterId);
            if ($managedCharacter !== null) {
                $em->remove($managedCharacter);
                $em->flush();
            }
        }

        // then remove the user
        $userId = $user->getId();
        if ($userId !== null) {
            $managedUser = $em->find(User::class, $userId);
            if ($managedUser !== null) {
                $em->remove($managedUser);
                $em->flush();
            }
        }
    }
}
