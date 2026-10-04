-- AddForeignKey
ALTER TABLE `fraud_alerts` ADD CONSTRAINT `fraud_alerts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
