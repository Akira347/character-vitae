<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250905000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Align DB user table with User entity: add first_name/last_name and allow password to be nullable; ensure roles type is JSON.';
    }

    public function up(Schema $schema): void
    {
        // Add first_name and last_name columns, allow password to be nullable
        $this->addSql("ALTER TABLE \"user\" ADD COLUMN first_name VARCHAR(100) DEFAULT NULL");
        $this->addSql("ALTER TABLE \"user\" ADD COLUMN last_name VARCHAR(100) DEFAULT NULL");
        $this->addSql("ALTER TABLE \"user\" ALTER COLUMN password DROP NOT NULL");

        // roles is already JSON in your migration; if not, uncomment the next line (Postgres):
        // $this->addSql("ALTER TABLE \"user\" ALTER COLUMN roles TYPE JSON USING roles::json");
    }

    public function down(Schema $schema): void
    {
        // revert changes
        $this->addSql("ALTER TABLE \"user\" ALTER COLUMN password SET NOT NULL");
        $this->addSql("ALTER TABLE \"user\" DROP COLUMN first_name");
        $this->addSql("ALTER TABLE \"user\" DROP COLUMN last_name");

        // If you changed roles type in up(), revert it here if needed.
    }
}
