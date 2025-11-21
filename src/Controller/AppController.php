<?php

declare(strict_types=1);

// src/Controller/AppController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

class AppController extends AbstractController
{
    /**
     * Serve the SPA entrypoint for the root.
     */
    #[Route('/', name: 'app_home', methods: ['GET'])]
    public function index(): Response
    {
        $projectDir = $this->getParameter('kernel.project_dir');

        if (!\is_string($projectDir)) {
            throw new \RuntimeException('kernel.project_dir parameter is invalid or missing.');
        }

        $filePath = $projectDir . '/public/front/index.html';

        if (!\is_file($filePath) || !\is_readable($filePath)) {
            throw new NotFoundHttpException('SPA entrypoint not found.');
        }

        return new BinaryFileResponse($filePath);
    }

    /**
     * Catch-all route for the SPA.
     *
     * Serves the same SPA index for any non-API route so client-side router can handle it.
     * It excludes endpoints that must be handled by Symfony (api, apip, _wdt, _profiler).
     */
    #[Route('/{path<^(?!api|apip|_wdt|_profiler).*>}', name: 'app_catch_all', methods: ['GET'])]
    public function catchAll(string $path = ''): Response
    {
        $projectDir = $this->getParameter('kernel.project_dir');

        if (!\is_string($projectDir)) {
            throw new \RuntimeException('kernel.project_dir parameter is invalid or missing.');
        }

        $filePath = $projectDir . '/public/front/index.html';

        if (!\is_file($filePath) || !\is_readable($filePath)) {
            throw new NotFoundHttpException('SPA entrypoint not found.');
        }

        return new BinaryFileResponse($filePath);
    }
}
