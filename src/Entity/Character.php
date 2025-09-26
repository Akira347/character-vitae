<?php

namespace App\Entity;

use App\Repository\CharacterRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CharacterRepository::class)]
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
     */
    #[ORM\Column(type: 'json', nullable: true)]
    #[Groups(['character:read','character:write'])]
    private array $layout = [];

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

    public function getLayout(): array {
        return $this->layout ?? [];
    }

    public function setLayout(array $layout): static {
        $this->layout = $layout; return $this;
    }
}
