-- AlterTable
ALTER TABLE `properties` ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verification_doc` VARCHAR(191) NULL;
