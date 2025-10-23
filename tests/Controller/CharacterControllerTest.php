<?php

// tests/Controller/CharacterControllerTest.php

namespace App\Tests\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CharacterControllerTest extends WebTestCase
{
    public function testCreateCharacterRequiresAuthentication(): void
    {
        $client = static::createClient();
        $payload = \json_encode(['title' => 'Test']) ?: '';
        $client->request('POST', '/api/characters', [], [], ['CONTENT_TYPE' => 'application/json'], $payload);
        $this->assertEquals(401, $client->getResponse()->getStatusCode());
    }

    public function testCreateCharacterSuccess(): void
    {
        $client = static::createClient();
        $container = static::getContainer();
        /** @var \Doctrine\ORM\EntityManagerInterface $em */
        $em = $container->get(\Doctrine\ORM\EntityManagerInterface::class);

        // create test user
        $user = (new User())
            ->setEmail('char_tester@example.com')
            ->setFirstName('Test')
            ->setLastName('User');
        $user->setPassword(\password_hash('password123', PASSWORD_BCRYPT));
        $user->setIsConfirmed(true); // <-- important: mark user as confirmed for login
        $em->persist($user);
        $em->flush();

        // login
        $payload = \json_encode([
            'username' => 'char_tester@example.com',
            'password' => 'password123',
        ]) ?: '';

        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], $payload);

        $this->assertEquals(200, $client->getResponse()->getStatusCode());

        $content = (string) $client->getResponse()->getContent();
        $data = \json_decode($content, true);

        /* @var array<string,mixed> $data */
        $this->assertIsArray($data);
        $this->assertArrayHasKey('token', $data);

        $token = '';
        if (\array_key_exists('token', $data) && (\is_scalar($data['token']) || $data['token'] === null)) {
            $token = (string) ($data['token'] ?? '');
        }

        // create character
        $payload2 = \json_encode([
            'title' => 'Mon Chevalier',
            'description' => 'Une courte description',
            'templateType' => 'template1',
        ]) ?: '';

        $client->request('POST', '/api/characters', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
        ], $payload2);

        $this->assertEquals(201, $client->getResponse()->getStatusCode());
        $content2 = (string) $client->getResponse()->getContent();
        $result = \json_decode($content2, true);
        $this->assertIsArray($result);
        $this->assertArrayHasKey('id', $result);

        // cleanup
        $userId = $user->getId();
        if ($userId !== null) {
            $persistedUser = $em->find(User::class, $userId);
            if ($persistedUser !== null) {
                $em->remove($persistedUser);
                $em->flush();
            }
        }
    }
}
