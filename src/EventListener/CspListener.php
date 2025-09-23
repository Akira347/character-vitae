<?php

// src/EventListener/CspListener.php

namespace App\EventListener;

use Symfony\Component\HttpKernel\Event\ResponseEvent;

class CspListener
{
    private string $policy;

    public function __construct(string $policy)
    {
        $this->policy = $policy;
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $response = $event->getResponse();
        $response->headers->set('Content-Security-Policy', $this->policy);
    }
}
