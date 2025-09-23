<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\User;
use Doctrine\Persistence\ManagerRegistry;
use PHPUnit\Framework\Assert;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class LoginTest extends WebTestCase
{
    public function testLoginSuccess(): void
    {
        $client = static::createClient();
        $container = static::getContainer();

        /** @var ManagerRegistry $doctrine */
        $doctrine = $container->get(ManagerRegistry::class);
        Assert::assertInstanceOf(ManagerRegistry::class, $doctrine);

        $em = $doctrine->getManager();

        /** @var UserPasswordHasherInterface $hasher */
        $hasher = $container->get(UserPasswordHasherInterface::class);
        $this->assertInstanceOf(UserPasswordHasherInterface::class, $hasher);

        // create user
        $user = new User();
        $user->setEmail('login-test@example.com');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword($hasher->hashPassword($user, 'secret123'));

        $em->persist($user);
        $em->flush();

        $payload = \json_encode(['username' => 'login-test@example.com', 'password' => 'secret123']);
        $this->assertNotFalse($payload);

        $client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) $payload
        );

        $this->assertResponseIsSuccessful();

        $content = $client->getResponse()->getContent();
        $this->assertIsString($content);

        $data = \json_decode($content, true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('token', $data);
        $this->assertIsString($data['token']);
    }

    public function testLoginFailure(): void
    {
        $client = static::createClient();

        $payload = \json_encode(['username' => 'nosuch@example.com', 'password' => 'wrong']);
        $this->assertNotFalse($payload);

        $client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            (string) $payload
        );

        $this->assertResponseStatusCodeSame(401);
    }
}
