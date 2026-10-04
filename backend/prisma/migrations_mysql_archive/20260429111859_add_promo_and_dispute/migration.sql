-- CreateTable
CREATE TABLE `promo_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `discount_percent` DOUBLE NOT NULL DEFAULT 0,
    `discount_amount` DOUBLE NOT NULL DEFAULT 0,
    `max_uses` INTEGER NOT NULL DEFAULT 0,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `valid_from` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valid_until` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `promo_codes_code_key`(`code`),
    INDEX `promo_codes_code_idx`(`code`),
    INDEX `promo_codes_is_active_idx`(`is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disputes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `raised_by` INTEGER NOT NULL,
    `against` INTEGER NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `resolution` TEXT NULL,
    `resolved_by` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disputes_booking_id_key`(`booking_id`),
    INDEX `disputes_booking_id_idx`(`booking_id`),
    INDEX `disputes_status_idx`(`status`),
    INDEX `disputes_raised_by_idx`(`raised_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_raised_by_fkey` FOREIGN KEY (`raised_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_against_fkey` FOREIGN KEY (`against`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
