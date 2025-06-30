<?php
    // tests/Entity/UserTest.php
    namespace App\Tests\Entity;

    use App\Entity\User;
    use PHPUnit\Framework\TestCase;

    class UserTest extends TestCase
    {
        public function testEmailRolePassword(): void
        {
            $u = new User();
            $u->setEmail('test@example.com');
            $u->setPassword('hashed');
            $this->assertSame('test@example.com', $u->getUserIdentifier());
            $this->assertContains('ROLE_USER', $u->getRoles());
            $this->assertSame('hashed', $u->getPassword());
        }
    }
