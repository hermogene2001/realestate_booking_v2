-- CreateTable
CREATE TABLE `commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `property_id` INTEGER NOT NULL,
    `owner_id` INTEGER NOT NULL,
    `platform_fee` DOUBLE NOT NULL,
    `owner_receives` DOUBLE NOT NULL,
    `total_amount` DOUBLE NOT NULL,
    `commission_rate` DOUBLE NOT NULL DEFAULT 5,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `commissions_booking_id_key`(`booking_id`),
    INDEX `commissions_owner_id_idx`(`owner_id`),
    INDEX `commissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
