-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('BOOKING_CREATED', 'DEPOSIT_CONFIRMED', 'HANDOVER_PENDING', 'FUNDS_RELEASED', 'REFUND_ISSUED', 'REVIEW_RECEIVED', 'PROPERTY_APPROVED', 'PROPERTY_REJECTED', 'FRAUD_ALERT', 'PAYMENT_FAILED', 'TIMEOUT_WARNING', 'DISPUTE_RESOLVED', 'BOOKING_TIMEOUT', 'BOOKING_CANCELLED', 'DOCUMENT_UPLOADED', 'DOCUMENT_APPROVED', 'DOCUMENT_REJECTED') NOT NULL;

-- CreateTable
CREATE TABLE `property_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `document_type` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_REVIEW',
    `rejection_reason` TEXT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewed_at` DATETIME(3) NULL,
    `reviewed_by` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `property_documents_property_id_idx`(`property_id`),
    INDEX `property_documents_status_idx`(`status`),
    INDEX `property_documents_document_type_idx`(`document_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `property_documents` ADD CONSTRAINT `property_documents_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_documents` ADD CONSTRAINT `property_documents_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
