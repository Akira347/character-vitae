<?php
declare(strict_types=1);
namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250908000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add confirmation_token and is_confirmed to user';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" ADD COLUMN confirmation_token VARCHAR(64) DEFAULT NULL');
        $this->addSql('ALTER TABLE "user" ADD COLUMN is_confirmed BOOLEAN NOT NULL DEFAULT false');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE "user" DROP COLUMN confirmation_token');
        $this->addSql('ALTER TABLE "user" DROP COLUMN is_confirmed');
    }
}
