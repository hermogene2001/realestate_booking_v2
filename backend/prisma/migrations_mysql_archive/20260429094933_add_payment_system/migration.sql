-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `currency` VARCHAR(191) NULL DEFAULT 'ETH',
    ADD COLUMN `payment_method` VARCHAR(191) NULL,
    ADD COLUMN `payment_status` VARCHAR(191) NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'ETH',
    `payment_method` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `transaction_id` VARCHAR(191) NULL,
    `provider_ref` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `paid_at` DATETIME(3) NULL,
    `refunded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_booking_id_key`(`booking_id`),
    UNIQUE INDEX `payments_transaction_id_key`(`transaction_id`),
    INDEX `payments_booking_id_idx`(`booking_id`),
    INDEX `payments_user_id_idx`(`user_id`),
    INDEX `payments_status_idx`(`status`),
    INDEX `payments_payment_method_idx`(`payment_method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
