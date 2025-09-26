<?php

// src/Entity/Character.php
declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use App\Repository\CharacterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CharacterRepository::class)]
#[ORM\Table(name: 'character')]
#[ApiResource(
    normalizationContext: ['groups' => ['character:read']],
    denormalizationContext: ['groups' => ['character:write']],
    // operations par défaut : GET collection, POST collection, GET item, PUT, DELETE
    // tu peux personnaliser security ici si besoin
)]
class Character
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['character:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['character:read', 'character:write'])]
    private ?string $title = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?string $description = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?string $templateType = null;

    #[ORM\ManyToOne(inversedBy: 'characters')]
    #[ORM\JoinColumn(nullable: false)]
    // Ne pas exposer l'objet owner complet côté public ; expose seulement l'ID si besoin
    private ?User $owner = null;

    /**
     * Layout/Sections JSON:
     * Exemple : [
     *   { "id":"sec-1","type":"Identité","width":200,"content":{...},"collapsed":false },
     *   ...
     * ]
     *
     * @var array<string, mixed>
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private array $layout = [];

    /**
     * Avatar data saved as JSON (nullable).
     *
     * @var array<string, mixed>|null
     */
    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['character:read', 'character:write'])]
    private ?array $avatar = null;

    public function __construct()
    {
        $this->layout = [];
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getTemplateType(): ?string
    {
        return $this->templateType;
    }

    public function setTemplateType(?string $templateType): static
    {
        $this->templateType = $templateType;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    /**
     * Accepts normalized layout array.
     *
     * @return array<string, mixed>
     */
    public function getLayout(): array
    {
        return $this->layout;
    }

    /**
     * Accepts normalized layout array.
     *
     * @param array<string, mixed> $layout
     */
    public function setLayout(array $layout): static
    {
        $this->layout = $layout;

        return $this;
    }

    /**
     * @return array<string,mixed>|null
     */
    public function getAvatar(): ?array
    {
        return $this->avatar;
    }

    /**
     * @param array<string,mixed>|null $avatar
     */
    public function setAvatar(?array $avatar): self
    {
        $this->avatar = $avatar;

        return $this;
    }
}
