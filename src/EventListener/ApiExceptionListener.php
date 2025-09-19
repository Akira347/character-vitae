<?php

// src/EventListener/ApiExceptionListener.php

namespace App\EventListener;

use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ApiExceptionListener
{
    private LoggerInterface $logger;
    private bool $debug;

    public function __construct(LoggerInterface $logger, bool $debug = false)
    {
        $this->logger = $logger;
        $this->debug = $debug;
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $status = 500;
        $message = 'Internal Server Error';

        if ($exception instanceof HttpExceptionInterface) {
            $status = $exception->getStatusCode();
            $message = $exception->getMessage() ?: $message;
        } elseif ($this->debug) {
            $message = $exception->getMessage();
        }

        $this->logger->error($exception->getMessage(), ['exception' => $exception]);

        $data = [
            'status' => $status,
            'error' => $message,
        ];

        if ($this->debug) {
            $data['trace'] = $exception->getTrace();
        }

        $event->setResponse(new JsonResponse($data, $status));
    }
}
