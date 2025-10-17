<?php
// src/Entity/Section.php
declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use App\Repository\SectionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

/**
 * Section entity.
 */
#[ORM\Entity(repositoryClass: SectionRepository::class)]
#[ORM\Table(name: 'section')]
#[ApiResource(
    normalizationContext: ['groups' => ['section:read']],
    denormalizationContext: ['groups' => ['section:write']]
)]
#[GetCollection(security: "is_granted('PUBLIC_ACCESS')")]
#[Post(security: "is_granted('ROLE_USER')")]
#[Get(security: "is_granted('PUBLIC_ACCESS')")]
#[Put(security: "is_granted('ROLE_USER')")]
#[Patch(security: "is_granted('ROLE_USER')")]
#[Delete(security: "is_granted('ROLE_USER')")]
class Section
{
    /**
     * Doctrine initialise cette propriété automatiquement à la persistance.
     * PHPStan signale parfois que la propriété n'est jamais assignée dans le constructeur.
     * On ignore cette règle pour cette ligne afin de garder la propriété typée.
     *
     * @phpstan-ignore-next-line
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['section:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Character::class, inversedBy: 'sections')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Character $character = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['section:read', 'section:write'])]
    private ?string $serverId = null;

    #[ORM\Column(length: 100)]
    #[Groups(['section:read', 'section:write'])]
    private string $type = 'empty';

    /**
     * @var array<string,mixed>|null
     */
    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['section:read', 'section:write'])]
    private ?array $content = null;

    #[ORM\Column(type: Types::INTEGER, nullable: true)]
    #[Groups(['section:read', 'section:write'])]
    private ?int $width = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Groups(['section:read', 'section:write'])]
    private int $position = 0;

    #[ORM\Column(type: Types::BOOLEAN)]
    #[Groups(['section:read', 'section:write'])]
    private bool $isCollapsed = true;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->isCollapsed = true;
        $this->position = 0;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCharacter(): ?Character
    {
        return $this->character;
    }

    public function setCharacter(?Character $character): static
    {
        $this->character = $character;
        return $this;
    }

    public function getServerId(): ?string
    {
        return $this->serverId;
    }

    public function setServerId(?string $serverId): static
    {
        $this->serverId = $serverId;
        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    /**
     * @return array<string,mixed>|null
     */
    public function getContent(): ?array
    {
        return $this->content;
    }

    /**
     * @param array<string,mixed>|null $content
     */
    public function setContent(?array $content): static
    {
        $this->content = $content;
        return $this;
    }

    public function getWidth(): ?int
    {
        return $this->width;
    }

    public function setWidth(?int $width): static
    {
        $this->width = $width;
        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function isCollapsed(): bool
    {
        return $this->isCollapsed;
    }

    public function setIsCollapsed(bool $isCollapsed): static
    {
        $this->isCollapsed = $isCollapsed;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
