<?php

// src/Controller/AppController.php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AppController extends AbstractController
{
    /**
     * Serve the SPA entrypoint for the root.
     */
    #[Route('/', name: 'app_home', methods: ['GET'])]
    public function index(): Response
    {
        $file = $this->getParameter('kernel.project_dir') . '/public/index.html';

        return new BinaryFileResponse($file);
    }

    /**
     * Catch-all route for the SPA.
     *
     * This will serve index.html for any path that does NOT start with:
     * - api
     * - apip
     * - _wdt
     * - _profiler
     *
     * The negative lookahead requirement avoids interfering with API or dev routes.
     */
    #[Route('/{path<.*>}', name: 'app_catch_all', methods: ['GET'], requirements: ['path' => '^(?!api|apip|_wdt|_profiler).*'])]
    public function catchAll(string $path = ''): Response
    {
        $file = $this->getParameter('kernel.project_dir') . '/public/index.html';

        return new BinaryFileResponse($file);
    }
}
