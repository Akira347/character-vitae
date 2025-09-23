<?php

// src/Controller/Api/CheckEmailController.php

namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class CheckEmailController
{
    public function __construct(private UserRepository $userRepository)
    {
    }

    #[Route('/api/check-email', name: 'api_check_email', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        try {
            /** @var array<string,mixed> $data */
            $data = $request->toArray();
        } catch (\Throwable $e) {
            $data = [];
        }

        $rawEmail = $data['email'] ?? null;

        // only cast when scalar (string|int|float|bool)
        if (!\is_scalar($rawEmail)) {
            return new JsonResponse(['error' => 'missing email'], 400);
        }

        $email = \trim((string) $rawEmail);

        if ($email === '') {
            return new JsonResponse(['error' => 'missing email'], 400);
        }

        $exists = (bool) $this->userRepository->findOneBy(['email' => $email]);

        return new JsonResponse(['exists' => $exists]);
    }
}
