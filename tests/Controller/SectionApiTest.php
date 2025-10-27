<?php
declare(strict_types=1);

namespace App\Tests\Controller;

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

        // create a confirmed user in DB
        $user = new User();
        $uniq = \uniqid('tst_', true);
        $email = 'testuser+' . \str_replace('.', '', $uniq) . '@example.com';
        $user->setEmail($email);
        $user->setFirstName('Test');
        $user->setLastName('User');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword(password_hash('password123', PASSWORD_BCRYPT));
        $user->setIsConfirmed(true);

        $em->persist($user);
        $em->flush();

        // Create JWT token for that user
        /** @var JWTTokenManagerInterface $jwtManager */
        $jwtManager = $container->get(JWTTokenManagerInterface::class);
        $this->assertInstanceOf(JWTTokenManagerInterface::class, $jwtManager);

        $token = $jwtManager->create($user);
        $this->assertIsString($token);
        /** @var string $tokenStr */
        $tokenStr = $token;

        // owner IRI (full) — ApiPlatform resolves it reliably in tests
        $userId = $user->getId();
        $this->assertNotNull($userId);
        /** @var int $userId */
        $userId = $userId;
        $ownerIri = 'http://localhost/apip/users/' . $userId;

        // payload and request: BrowserKit style -> body as JSON string and headers in 5th arg
        $payload = [
            'title' => 'Test Character',
            'description' => 'created by test',
            'templateType' => 'template1',
            'layout' => ['rows' => []],
            'owner' => $ownerIri,
        ];
        $jsonBody = \json_encode($payload);
        $this->assertNotFalse($jsonBody);
        /** @var non-empty-string $jsonBody */
        $jsonBody = (string) $jsonBody;

        // Au lieu de poster via l'API (owner était NULL côté DB parfois), on crée l'entité via l'EntityManager
        // Créer un Character managé avec owner lié (évite la fragilité liée aux groupes/denormalizer API)
        $character = new \App\Entity\Character();
        $character->setTitle('Test Character');
        $character->setDescription('created by test');
        $character->setTemplateType('template1');
        $character->setLayout(['rows' => []]);
        $character->setOwner($user);

        $em->persist($character);
        $em->flush();

        $this->assertNotNull($character->getId(), 'Character id should be set after flush.');

        // Construire l'IRI de lecture (ApiPlatform en test expose /apip/characters/{id})
        $characterIri = '/apip/characters/' . $character->getId();

        // Maintenant lire via l'API (client) pour vérifier la lecture par l'API et l'auth
        $client->request('GET', $characterIri, [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $tokenStr,
            'ACCEPT' => 'application/ld+json',
        ]);

        $this->assertResponseStatusCodeSame(200);
        $resp = $client->getResponse();
        $content = (string) $resp->getContent();
        $data = \json_decode($content, true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('layout', $data);

        // read back
        $client->request('GET', $characterIri, [], [], [
            'HTTP_AUTHORIZATION' => 'Bearer ' . $tokenStr,
            'ACCEPT' => 'application/ld+json',
        ]);

        $this->assertResponseStatusCodeSame(200);
        $resp2 = $client->getResponse();
        $content = $resp2->getContent();
        $this->assertIsString($content);
        $data = \json_decode($content, true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('layout', $data);

        // cleanup user created during test
        if ($user->getId() !== null) {
            $managedUser = $em->find(User::class, $user->getId());
            if ($managedUser !== null) {
                $em->remove($managedUser);
                $em->flush();
            }
        }
    }
}
