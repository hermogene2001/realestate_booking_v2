-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_verified` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `id_doc_front` VARCHAR(191) NOT NULL,
    `id_doc_back` VARCHAR(191) NOT NULL,
    `selfie` VARCHAR(191) NULL,
    `verified_at` DATETIME(3) NULL,
    `rejection_reason` VARCHAR(191) NULL,
    `reviewed_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `verifications_user_id_key`(`user_id`),
    INDEX `verifications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `verifications` ADD CONSTRAINT `verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
