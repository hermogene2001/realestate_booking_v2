-- AlterTable
ALTER TABLE `users` ADD COLUMN `backup_codes` JSON NULL,
    ADD COLUMN `two_factor_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `two_factor_secret` VARCHAR(191) NULL;
