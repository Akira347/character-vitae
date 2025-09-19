<?php
// src/Controller/Api/CheckEmailController.php
namespace App\Controller\Api;

use App\Repository\UserRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class CheckEmailController
{
    public function __construct(private UserRepository $userRepository) {}

    #[Route('/api/check-email', name: 'api_check_email', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? null;
        if (!$email) {
            return new JsonResponse(['error' => 'missing email'], 400);
        }
        $exists = (bool)$this->userRepository->findOneBy(['email' => $email]);
        return new JsonResponse(['exists' => $exists]);
    }
}
