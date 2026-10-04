-- CreateTable
CREATE TABLE `availabilities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `is_booked` BOOLEAN NOT NULL DEFAULT false,
    `booking_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `availabilities_booking_id_key`(`booking_id`),
    INDEX `availabilities_property_id_idx`(`property_id`),
    INDEX `availabilities_date_idx`(`date`),
    INDEX `availabilities_is_booked_idx`(`is_booked`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `availabilities` ADD CONSTRAINT `availabilities_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `availabilities` ADD CONSTRAINT `availabilities_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
