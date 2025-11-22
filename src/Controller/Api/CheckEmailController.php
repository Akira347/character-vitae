<?php

// src/Controller/Api/CheckEmailController.php

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;

#[Route('/api/check-email', name: 'api_check_email', methods: ['POST'])]
class CheckEmailController
{
    public function __construct(private UserRepository $userRepository, private LoggerInterface $logger)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $t0 = microtime(true);
        $this->logger->info('check-email:start', ['ts' => $t0]);
        try {
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $this->logger->warning('check-email:invalid-json', ['err' => $e->getMessage(), 'elapsed_ms' => (microtime(true)-$t0)*1000]);
            $data = [];
        }
        $this->logger->info('check-email:after-parse', ['elapsed_ms' => (microtime(true)-$t0)*1000]);

        $rawEmail = $data['email'] ?? null;
        if (!\is_scalar($rawEmail)) {
            $this->logger->info('check-email:missing-scalar', ['elapsed_ms' => (microtime(true)-$t0)*1000]);
            return new JsonResponse(['error' => 'missing email'], 400);
        }

        $email = \trim((string) $rawEmail);
        $this->logger->info('check-email:before-db', ['elapsed_ms' => (microtime(true)-$t0)*1000]);

        $exists = (bool) $this->userRepository->findOneBy(['email' => $email]);

        $this->logger->info('check-email:end', ['exists' => $exists, 'total_ms' => (microtime(true)-$t0)*1000]);
        return new JsonResponse(['exists' => $exists]);
    }
}