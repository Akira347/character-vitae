<?php

use Symfony\Component\Dotenv\Dotenv;

require dirname(__DIR__).'/vendor/autoload.php';

// On sait que bootEnv existe à partir de Symfony 5+, on peut forcer l’appel
(new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
