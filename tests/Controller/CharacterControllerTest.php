<?php

namespace App\Tests\Controller;

use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CharacterControllerTest extends WebTestCase
{
    public function testCreateCharacterRequiresAuthentication(): void
    {
        $client = static::createClient();
        $payload = \json_encode(['title' => 'Test']) ?: '';
        $client->request(
            'POST',
            '/api/characters',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $payload
        );

        $this->assertEquals(401, $client->getResponse()->getStatusCode());
    }

    public function testCreateCharacterSuccess(): void
    {
        $client = static::createClient();
        $container = static::getContainer();
        /** @var \Doctrine\ORM\EntityManagerInterface $em */
        $em = $container->get(\Doctrine\ORM\EntityManagerInterface::class);

        // créer l'utilisateur test
        $user = (new User())
            ->setEmail('char_tester@example.com')
            ->setFirstName('Test')
            ->setLastName('User')
            ->setIsConfirmed(true)
            ->setPassword(\password_hash('password123', PASSWORD_BCRYPT));
        $em->persist($user);
        $em->flush();

        // login via API — note: JSON login expects "email" key in this project
        $payload = \json_encode([
            'email' => 'char_tester@example.com',
            'password' => 'password123',
        ]) ?: '';
        $client->request(
            'POST',
            '/api/login_check',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $payload
        );

        $this->assertResponseStatusCodeSame(200);

        $content = (string) $client->getResponse()->getContent();
        $data = \json_decode($content, true);

        if (!\is_array($data)) {
            $this->fail('Response from login_check is not an array');
        }
        /* @var array<string,mixed> $data */

        $this->assertArrayHasKey('token', $data);
        if (!isset($data['token']) || !\is_scalar($data['token'])) {
            $this->fail('Login response token is missing or not scalar');
        }
        $token = (string) $data['token'];

        // create character via API
        $payload2 = \json_encode([
            'title' => 'Mon Chevalier',
            'description' => 'Une courte description',
            'templateType' => 'template1',
        ]) ?: '';

        $client->request(
            'POST',
            '/api/characters',
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            ],
            $payload2
        );

        $this->assertResponseStatusCodeSame(201);

        $content2 = (string) $client->getResponse()->getContent();
        $result = \json_decode($content2, true);

        if (!\is_array($result)) {
            $this->fail('Response from creating character is not an array');
        }
        /* @var array<string,mixed> $result */

        $this->assertArrayHasKey('id', $result);

        // cleanup: remove user (and cascade will remove characters if configured)
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
