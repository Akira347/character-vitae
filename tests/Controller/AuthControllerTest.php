<?php
// tests/Controller/AuthControllerTest.php
namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Doctrine\ORM\EntityManagerInterface;

class AuthControllerTest extends WebTestCase
{
    private $client;
    private $em;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();

        // si tu veux purger la table users entre les tests (optionnel)
        $kernel = self::bootKernel();
        $this->em = $kernel->getContainer()->get('doctrine')->getManager();
        // Exemple de purge (adapter le nom de table selon ta conf)
        // $this->em->getConnection()->executeStatement('TRUNCATE TABLE user RESTART IDENTITY CASCADE');
    }

    public function testRegisterAndMe(): void
    {
        $payload = [
            'email' => 'testuser@example.com',
            'password' => 'password123'
        ];

        // 1) Register
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode($payload)
        );

        $resp = $this->client->getResponse();
        $content = $resp->getContent();
        $status = $resp->getStatusCode();

        // affiche le body en cas d'échec pour debugging
        $this->assertSame(
            201,
            $status,
            sprintf("Expected 201 but got %d. Response body: %s", $status, $content)
        );

        $data = json_decode($content, true);
        $this->assertArrayHasKey('id', $data);

        // 2) Se loguer / récupérer token
        // Selon ton système d'auth (login json, jwt, etc.), adapte la route & le parsing.
        // Exemple pour un endpoint /api/login qui renvoie { token: '...' } :
        $this->client->request('POST','/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
            'username' => $payload['email'],
            'password' => $payload['password'],
        ]));


        $this->assertSame(200, $this->client->getResponse()->getStatusCode(), 'Login failed: '.$this->client->getResponse()->getContent());
        $tokenData = json_decode($this->client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('token', $tokenData);
        $token = $tokenData['token'];

        // 3) GET /api/me avec Authorization header
        $this->client->request('GET', '/api/me', [], [], ['HTTP_Authorization' => 'Bearer '.$token]);
        $this->assertSame(200, $this->client->getResponse()->getStatusCode(), 'Me failed: '.$this->client->getResponse()->getContent());
    }

    protected function tearDown(): void
    {
        parent::tearDown();
        if ($this->em) {
            $this->em->close();
            $this->em = null;
        }
    }
}
