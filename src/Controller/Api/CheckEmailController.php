<?php

// src/Controller/Api/CheckEmailController.php

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

class CheckEmailController
{
    public function __construct(private UserRepository $userRepository, private LoggerInterface $logger)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $t0 = microtime(true);
        $this->logger->info('check-email:start', ['remote' => $request->getClientIp(), 'ts' => $t0]);

        try {
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $this->logger->warning('check-email:invalid-json', ['err' => $e->getMessage(), 'elapsed_ms' => (microtime(true)-$t0)*1000]);
            $data = [];
        }

        $t1 = microtime(true);
        $this->logger->info('check-email:after-parse', ['elapsed_ms' => ($t1-$t0)*1000]);

        $rawEmail = $data['email'] ?? null;
        if (!\is_scalar($rawEmail)) {
            $this->logger->info('check-email:missing-scalar', ['elapsed_ms' => (microtime(true)-$t0)*1000]);
            return new JsonResponse(['error' => 'missing email'], 400);
        }

        $email = \trim((string) $rawEmail);

        $t2 = microtime(true);
        $this->logger->info('check-email:before-db', ['elapsed_ms' => ($t2-$t0)*1000]);

        $exists = (bool) $this->userRepository->findOneBy(['email' => $email]);

        $t3 = microtime(true);
        $this->logger->info('check-email:end', ['exists' => $exists, 'total_ms' => ($t3-$t0)*1000, 'db_ms' => ($t3-$t2)*1000]);

        return new JsonResponse(['exists' => $exists]);
    }
}