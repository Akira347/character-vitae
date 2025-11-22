<?php

// tests/Controller/AuthControllerTest.php

namespace App\Tests\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
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

        $this->assertSame(
            201,
            $status,
            \sprintf('Expected 201 but got %d. Response body: %s', $status, \var_export($content, true))
        );

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
        $this->assertNotNull($this->em, 'EntityManager not available in test.');
        $this->em->clear();
        $user = $this->em->getRepository(\App\Entity\User::class)->find($id);
        $this->assertNotNull($user);
        $this->assertNotNull($user->getConfirmationToken(), 'Expected confirmation token to be set.');
        $this->assertFalse($user->isConfirmed());

        // --- simulate user clicking the confirmation link by calling /api/confirm?token=...
        $token = $user->getConfirmationToken();
        $this->assertIsString($token, 'Confirmation token should be a string for the test');

        $this->client->request('GET', '/api/confirm?token='.\urlencode($token));
        $confirmResp = $this->client->getResponse();
        $this->assertSame(200, $confirmResp->getStatusCode(), 'Confirmation failed: '.\var_export($confirmResp->getContent(), true));

        // RELOAD the user from the EntityManager to get a managed, up-to-date instance
        // (avoid refresh() on a possibly detached instance)
        $this->assertNotNull($this->em, 'EntityManager not available in test.');
        $this->em->clear();
        $user = $this->em->getRepository(\App\Entity\User::class)->find($id);
        $this->assertInstanceOf(\App\Entity\User::class, $user);
        $this->assertTrue($user->isConfirmed(), 'User should be confirmed after hitting confirm endpoint');

        // 2) Se loguer / récupérer token
        $loginBody = \json_encode([
            'email' => $payload['email'],
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

        $payload = ['email' => 'testusersendmail@example.com', 'password' => 'password123'];
        $body = \json_encode($payload, JSON_THROW_ON_ERROR);

        $client->request('POST', '/api/register', [], [], ['CONTENT_TYPE' => 'application/json'], $body);

        $this->assertSame(201, $client->getResponse()->getStatusCode(), 'Register failed: '.$client->getResponse()->getContent());

        $container = static::getContainer();

        // Prefer using the message logger listener (available in many Symfony versions)
        if ($container->has('mailer.message_logger_listener')) {
            $loggerListener = $container->get('mailer.message_logger_listener');

            // try to get events from the common MessageLoggerListener API
            if ($loggerListener instanceof \Symfony\Component\Mailer\EventListener\MessageLoggerListener) {
                $eventsRaw = $loggerListener->getEvents();
            } elseif (\is_object($loggerListener) && \property_exists($loggerListener, 'events')) {
                // some debug representations expose public 'events'
                $eventsRaw = $loggerListener->events;
            } else {
                $this->markTestIncomplete('message logger listener API unexpected for this Symfony version.');
            }

            // normalize to array of MessageEvent
            if ($eventsRaw instanceof \Symfony\Component\Mailer\Event\MessageEvents) {
                $events = $eventsRaw->getEvents();
            } elseif (\is_array($eventsRaw)) {
                $events = $eventsRaw;
            } else {
                $this->markTestIncomplete('Could not normalize mailer events from logger listener.');
            }

            // assert we have at least one event (may be 2: queued + sent)
            $this->assertNotEmpty($events, 'Expected at least one mail event');

            // find the first MessageEvent that contains an Email and assert subject
            $foundSubject = null;
            foreach ($events as $ev) {
                if (!($ev instanceof \Symfony\Component\Mailer\Event\MessageEvent)) {
                    continue;
                }
                $msg = $ev->getMessage();
                if ($msg instanceof Email) {
                    $foundSubject = $msg->getSubject();
                    break;
                }
            }

            $this->assertNotNull($foundSubject, 'No Email message found in mailer events');
            $this->assertStringContainsString('Confirmez votre compte', (string) $foundSubject);
        } elseif ($container->has('mailer.transport') && \method_exists($container->get('mailer.transport'), 'getSent')) {
            // fallback for older setups that expose a transport with getSent()
            $transport = $container->get('mailer.transport');
            $sent = $transport->getSent();
            $this->assertIsArray($sent, 'Transport::getSent() must return an array');
            $this->assertNotEmpty($sent, 'Expected at least one sent message');
            if (isset($sent[0]) && $sent[0] instanceof Email) {
                $subject = $sent[0]->getSubject();
                $this->assertNotNull($subject, 'Expected the sent email to have a subject');
                $this->assertStringContainsString('Confirmez votre compte', (string) $subject);
            }
        } else {
            $this->markTestIncomplete('No suitable mail logging/transport service available in test container.');
        }
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
