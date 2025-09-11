<?php

// tests/Controller/AuthControllerTest.php

namespace App\Tests\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class AuthControllerTest extends WebTestCase
{
    private KernelBrowser $client;
    private ?EntityManagerInterface $em = null;

    protected function setUp(): void
    {
        self::ensureKernelShutdown();
        $this->client = static::createClient();

        /** @var EntityManagerInterface $em */
        $em = static::getContainer()->get(EntityManagerInterface::class);
        $this->em = $em;
        // Exemple de purge (adapter le nom de table selon ta conf)
        // $this->em->getConnection()->executeStatement('TRUNCATE TABLE user RESTART IDENTITY CASCADE');
    }

    public function testRegisterAndMe(): void
    {
        $payload = [
            'email' => 'testuser@example.com',
            'password' => 'password123',
        ];

        $body = \json_encode($payload, JSON_THROW_ON_ERROR);

        // 1) Register
        $this->client->request(
            'POST',
            '/api/register',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            $body
        );

        $resp = $this->client->getResponse();
        $content = $resp->getContent();
        $status = $resp->getStatusCode();

        // affiche le body en cas d'échec pour debugging (var_export renvoie toujours une string)
        $this->assertSame(
            201,
            $status,
            \sprintf('Expected 201 but got %d. Response body: %s', $status, \var_export($content, true))
        );

        // on s'assure que le contenu est bien une string avant json_decode
        $this->assertIsString($content, 'Response content must be a string');
        /** @var string $content */
        $content = $content;

        /** @var array<string, mixed> $data */
        $data = \json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('id', $data);
        $this->assertIsInt($data['id']);
        $id = $data['id'];

        // assert user a confirmationToken ok
        $this->assertNotNull($this->em);
        $user = $this->em->getRepository(\App\Entity\User::class)->find($id);
        $this->assertNotNull($user);
        $this->assertNotNull($user->getConfirmationToken(), 'Expected confirmation token to be set.');
        $this->assertFalse($user->isConfirmed());

        // 2) Se loguer / récupérer token
        $loginBody = \json_encode([
            'username' => $payload['email'],
            'password' => $payload['password'],
        ], JSON_THROW_ON_ERROR);

        $this->client->request('POST', '/api/login_check', [], [], ['CONTENT_TYPE' => 'application/json'], $loginBody);

        $loginResp = $this->client->getResponse();
        $loginContent = $loginResp->getContent();
        $this->assertSame(200, $loginResp->getStatusCode(), 'Login failed: '.\var_export($loginContent, true));

        $this->assertIsString($loginContent, 'Login response content must be a string');
        /** @var string $loginContent */
        $loginContent = $loginContent;

        /** @var array<string, mixed> $tokenData */
        $tokenData = \json_decode($loginContent, true, 512, JSON_THROW_ON_ERROR);
        $this->assertIsArray($tokenData);
        $this->assertArrayHasKey('token', $tokenData);
        $this->assertIsString($tokenData['token']);
        $token = $tokenData['token'];

        // 3) GET /api/me avec Authorization header
        $this->client->request('GET', '/api/me', [], [], ['HTTP_Authorization' => 'Bearer '.$token]);
        $meResp = $this->client->getResponse();
        $meContent = $meResp->getContent();
        $this->assertSame(200, $meResp->getStatusCode(), 'Me failed: '.\var_export($meContent, true));
    }

    public function testRegisterSendsEmail(): void
    {
        self::ensureKernelShutdown();
        $client = static::createClient();

        // create a spy/mock for the MailerInterface
        $mailerMock = $this->createMock(MailerInterface::class);
        $mailerMock->expects($this->once())
            ->method('send')
            ->with($this->isInstanceOf(Email::class));

        // inject the mock in the test container (requires test.service_container enabled)
        static::getContainer()->set(MailerInterface::class, $mailerMock);

        // perform register request...
        $payload = ['email' => 'testusersendmail@example.com', 'password' => 'password123'];
        $body = \json_encode($payload, JSON_THROW_ON_ERROR);

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], $body);

        $respContent = $client->getResponse()->getContent();
        $this->assertSame(201, $client->getResponse()->getStatusCode(), 'Register failed: '.\var_export($respContent, true));

        // la vérification que la mock du mailer a bien été appelée est faite par l'expectation précédente
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
