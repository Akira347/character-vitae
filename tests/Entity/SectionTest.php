<?php
// tests/Entity/SectionTest.php
declare(strict_types=1);

namespace App\Tests\Entity;

use App\Entity\Section;
use PHPUnit\Framework\TestCase;

final class SectionTest extends TestCase
{
    public function testSettersAndGetters(): void
    {
        $s = new Section();
        $s->setType('Contact');
        $s->setContent(['phone' => '0123456789']);
        $s->setIsCollapsed(false);
        $s->setWidth(280);

        $this->assertSame('Contact', $s->getType());
        $this->assertIsArray($s->getContent());
        $this->assertFalse($s->isCollapsed());
        $this->assertSame(280, $s->getWidth());
    }
}
