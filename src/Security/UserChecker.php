<?php

// src/Security/UserChecker.php
declare(strict_types=1);

namespace App\Security;

use App\Entity\User;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAccountStatusException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

final class UserChecker implements UserCheckerInterface
{
    public function checkPreAuth(UserInterface $user): void
    {
        // Ne rien faire si ce n'est pas notre entité User
        if (!$user instanceof User) {
            return;
        }

        // Refuser l'accès si l'utilisateur n'a pas confirmé son compte
        if (!$user->isConfirmed()) {
            // message affiché à l'utilisateur (sécurisé)
            throw new CustomUserMessageAccountStatusException('Votre compte n’a pas encore été confirmé. Vérifiez vos e-mails.');
        }
    }

    public function checkPostAuth(UserInterface $user): void
    {
        // Pas d'autres vérifications post-auth pour l'instant
        return;
    }
}
