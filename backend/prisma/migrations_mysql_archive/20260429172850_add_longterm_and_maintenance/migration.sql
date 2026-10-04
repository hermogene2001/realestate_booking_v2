-- CreateTable
CREATE TABLE `long_term_rentals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `monthly_rent` DOUBLE NOT NULL,
    `deposit` DOUBLE NOT NULL DEFAULT 0,
    `lease_start` DATETIME(3) NOT NULL,
    `lease_end` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `payment_day` INTEGER NOT NULL DEFAULT 1,
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `terms` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `long_term_rentals_property_id_idx`(`property_id`),
    INDEX `long_term_rentals_tenant_id_idx`(`tenant_id`),
    INDEX `long_term_rentals_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `property_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `cost` DOUBLE NOT NULL DEFAULT 0,
    `photos` JSON NOT NULL,
    `assigned_to` INTEGER NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `maintenance_requests_property_id_idx`(`property_id`),
    INDEX `maintenance_requests_status_idx`(`status`),
    INDEX `maintenance_requests_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `long_term_rentals` ADD CONSTRAINT `long_term_rentals_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `long_term_rentals` ADD CONSTRAINT `long_term_rentals_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_requests` ADD CONSTRAINT `maintenance_requests_assigned_to_fkey` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
