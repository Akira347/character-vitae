<?php
// src/DataFixtures/AppFixtures.php
namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Character;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    private UserPasswordHasherInterface $hasher;

    public function __construct(UserPasswordHasherInterface $hasher)
    {
        $this->hasher = $hasher;
    }

    public function load(ObjectManager $manager): void
    {
        $user = new User();
        $user->setEmail('alice@example.com');
        $user->setFirstName('Alice');
        $user->setLastName('Smith');
        $user->setRoles(['ROLE_USER']);
        $user->setPassword($this->hasher->hashPassword($user, 'password123'));
        $manager->persist($user);

        // Exemple de Character (ajuste l'entité Character)
        $char = new Character();
        $char->setTitle('Alicia the Brave');
        $char->setOwner($user);
        $manager->persist($char);

        $manager->flush();
    }
}
