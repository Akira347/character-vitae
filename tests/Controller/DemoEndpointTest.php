<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class DemoEndpointTest extends WebTestCase
{
    public function testDemoEndpointReturnsCharacterShape(): void
    {
        $client = static::createClient();
        $client->request('GET', '/apip/character/demo');

        $this->assertResponseIsSuccessful();

        $resp = $client->getResponse();
        // getContent() returns string; decode to array to inspect content safely
        $content = (string) $resp->getContent();
        $data = \json_decode($content, true);

        $this->assertIsArray($data, 'Demo endpoint must return a JSON object decoded to array');

        // Basic shape expectations — adapte si ta demo renvoie autre chose
        $this->assertArrayHasKey('title', $data);
        $this->assertArrayHasKey('layout', $data);
    }
}
