<?php

// src/OpenApi/AuthOpenApiFactory.php
declare(strict_types=1);

namespace App\OpenApi;

use ApiPlatform\OpenApi\Factory\OpenApiFactoryInterface;
use ApiPlatform\OpenApi\Model;
use ApiPlatform\OpenApi\OpenApi;

final class AuthOpenApiFactory implements OpenApiFactoryInterface
{
    public function __construct(private OpenApiFactoryInterface $decorated)
    {
    }

    public function __invoke(array $context = []): OpenApi
    {
        $openApi = ($this->decorated)($context);

        $components = $openApi->getComponents();
        $schemas = $components->getSchemas();

        // Schemas
        $schemas['RegisterInput'] = new \ArrayObject([
            'type' => 'object',
            'properties' => [
                'email' => ['type' => 'string', 'format' => 'email'],
                'password' => ['type' => 'string'],
                'firstName' => ['type' => 'string'],
                'lastName' => ['type' => 'string'],
            ],
            'required' => ['email', 'password'],
        ]);

        $schemas['UserOutput'] = new \ArrayObject([
            'type' => 'object',
            'properties' => [
                'id' => ['type' => 'integer'],
                'email' => ['type' => 'string'],
                'firstName' => ['type' => 'string'],
                'lastName' => ['type' => 'string'],
                'fullName' => ['type' => 'string'],
            ],
        ]);

        // /api/register POST
        $registerRequestBody = new Model\RequestBody(
            'Register payload',
            new \ArrayObject([
                'application/json' => [
                    'schema' => ['$ref' => '#/components/schemas/RegisterInput'],
                ],
            ]),
            true
        );

        $registerOperation = new Model\Operation(
            operationId: 'postRegister',
            tags: ['Auth'],
            responses: [
                '201' => [
                    'description' => 'User created',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/UserOutput'],
                        ],
                    ],
                ],
                '422' => ['description' => 'Validation error'],
                '400' => ['description' => 'Bad request'],
                '409' => ['description' => 'Email already used'],
            ],
            summary: 'Register a new user',
            requestBody: $registerRequestBody
        );

        $registerPathItem = new Model\PathItem(post: $registerOperation);
        $openApi->getPaths()->addPath('/api/register', $registerPathItem);

        // /api/confirm GET (token as query param)
        $confirmOperation = new Model\Operation(
            operationId: 'getConfirm',
            tags: ['Auth'],
            responses: [
                '200' => ['description' => 'Confirmed'],
                '400' => ['description' => 'Invalid token'],
            ],
            summary: 'Confirm user account using token (query param ?token=...)'
        );
        $confirmPathItem = new Model\PathItem(get: $confirmOperation);
        $openApi->getPaths()->addPath('/api/confirm', $confirmPathItem);

        // /api/me GET (auth required)
        $meOperation = new Model\Operation(
            operationId: 'getMe',
            tags: ['Auth'],
            responses: [
                '200' => [
                    'description' => 'Current user info',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/UserOutput'],
                        ],
                    ],
                ],
                '401' => ['description' => 'Unauthenticated'],
            ],
            summary: 'Return the current authenticated user',
            security: [['bearerAuth' => []]]
        );
        $mePathItem = new Model\PathItem(get: $meOperation);
        $openApi->getPaths()->addPath('/api/me', $mePathItem);

        // Récupère la collection des securitySchemes (ArrayObject ou tableau)
        $securitySchemes = $components->getSecuritySchemes() ?? new \ArrayObject();

        // Si le schéma bearerAuth n'existe pas, on l'ajoute proprement
        if (!isset($securitySchemes['bearerAuth'])) {
            $securitySchemes['bearerAuth'] = new \ArrayObject([
                'type' => 'http',
                'scheme' => 'bearer',
                'bearerFormat' => 'JWT',
            ]);

            // on crée une nouvelle instance de Components avec les securitySchemes modifiés
            /** @phpstan-ignore-next-line */
            if (\method_exists($components, 'withSecuritySchemes')) {
                $components = $components->withSecuritySchemes($securitySchemes);
                // et on remplace l'OpenApi par une nouvelle instance qui contient ces components
                /** @phpstan-ignore-next-line */
                if (\method_exists($openApi, 'withComponents')) {
                    $openApi = $openApi->withComponents($components);
                } else {
                    // backup : si withComponents n'existe pas (très rare), on essaie d'écrire directement
                    $componentsProperty = new \ReflectionProperty($openApi, 'components');
                    $componentsProperty->setAccessible(true);
                    $componentsProperty->setValue($openApi, $components);
                }
            } else {
                // fallback pour anciennes versions: manipuler directement l'ArrayObject
                $components->getSecuritySchemes()['bearerAuth'] = $securitySchemes['bearerAuth'];
            }
        }

        return $openApi;
    }
}
