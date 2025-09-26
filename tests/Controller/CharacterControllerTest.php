<?php
// tests/Controller/CharacterControllerTest.php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

class CharacterControllerTest extends WebTestCase
{
    public function testCreateCharacterRequiresAuthentication()
    {
        $client = static::createClient();
        $client->request('POST', '/api/characters', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'title' => 'Test',
        ]));
        $this->assertEquals(401, $client->getResponse()->getStatusCode());
    }

    public function testCreateCharacterSuccess()
    {
        $kernel = self::bootKernel();
        $em = $kernel->getContainer()->get('doctrine')->getManager();

        // create test user
        $user = (new User())->setEmail('char_tester@example.com')->setFirstName('Test')->setLastName('User');
        $user->setPassword(password_hash('password123', PASSWORD_BCRYPT)); // or use password hasher
        $em->persist($user);
        $em->flush();

        $client = static::createClient();

        // get JWT token via login endpoint (adjust if you have another path)
        $client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => 'char_tester@example.com',
            'password' => 'password123'
        ]));

        $this->assertEquals(200, $client->getResponse()->getStatusCode(), $client->getResponse()->getContent());

        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $data);
        $token = $data['token'];

        // create character
        $client->request('POST', '/api/characters', [], [], [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        ], json_encode([
            'title' => 'Mon Chevalier',
            'description' => 'Une courte description',
            'templateType' => 'template1',
        ]));

        $this->assertEquals(201, $client->getResponse()->getStatusCode(), $client->getResponse()->getContent());
        $result = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $result);

        // cleanup
        $em->remove($user);
        $em->flush();
    }
}
