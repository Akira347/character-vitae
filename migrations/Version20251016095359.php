<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251016095359 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE section (id SERIAL NOT NULL, character_id INT NOT NULL, server_id VARCHAR(100) DEFAULT NULL, type VARCHAR(100) NOT NULL, content JSON DEFAULT NULL, width INT DEFAULT NULL, position INT NOT NULL, is_collapsed BOOLEAN NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_2D737AEF1136BE75 ON section (character_id)');
        $this->addSql('COMMENT ON COLUMN section.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN section.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE section ADD CONSTRAINT FK_2D737AEF1136BE75 FOREIGN KEY (character_id) REFERENCES character (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE section DROP CONSTRAINT FK_2D737AEF1136BE75');
        $this->addSql('DROP TABLE section');
    }
}
