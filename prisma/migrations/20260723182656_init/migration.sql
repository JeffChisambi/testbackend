-- CreateTable
CREATE TABLE `ipcs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `region` VARCHAR(50) NOT NULL,
    `location` VARCHAR(150) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ipcs_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('admin', 'registration_officer', 'extension_officer', 'marketing_officer', 'warehouse_officer', 'ipc_manager', 'headoffice_manager') NOT NULL DEFAULT 'registration_officer',
    `ipc_id` INTEGER NULL,
    `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    `avatar` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `idx_users_role`(`role`),
    INDEX `idx_users_ipc_id`(`ipc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clubs_associations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ipc_id` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `association_name` VARCHAR(120) NULL,
    `zone` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_clubs_ipc`(`ipc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farmers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farmer_id` VARCHAR(30) NOT NULL,
    `first_name` VARCHAR(60) NOT NULL,
    `last_name` VARCHAR(60) NOT NULL,
    `nrc_id` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
    `date_of_birth` DATETIME(3) NULL,
    `address` TEXT NULL,
    `club_id` INTEGER NULL,
    `gps_latitude` DECIMAL(10, 8) NULL,
    `gps_longitude` DECIMAL(11, 8) NULL,
    `fingerprint_template` TEXT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `registered_by_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `farmers_farmer_id_key`(`farmer_id`),
    UNIQUE INDEX `farmers_nrc_id_key`(`nrc_id`),
    INDEX `idx_farmer_nrc`(`nrc_id`),
    INDEX `idx_farmer_phone`(`phone`),
    INDEX `idx_farmer_club`(`club_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commodities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `unit_of_measure` VARCHAR(20) NOT NULL DEFAULT 'KG',
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `commodities_name_key`(`name`),
    UNIQUE INDEX `commodities_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commodity_varieties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `commodity_id` INTEGER NOT NULL,
    `variety_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,

    INDEX `idx_varieties_commodity`(`commodity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `farmer_crops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farmer_id` INTEGER NOT NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `acreage_hectares` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `estimated_yield_kg` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `season` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seed_loans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farmer_id` INTEGER NOT NULL,
    `commodity_id` INTEGER NOT NULL,
    `loan_amount` DECIMAL(12, 2) NOT NULL,
    `loan_balance` DECIMAL(12, 2) NOT NULL,
    `issue_date` DATETIME(3) NOT NULL,
    `due_date` DATETIME(3) NULL,
    `status` ENUM('active', 'paid', 'defaulted') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_loans_farmer`(`farmer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_ref` VARCHAR(30) NOT NULL,
    `farmer_id` INTEGER NOT NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
    `quantity_kg` DECIMAL(10, 2) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_amount` DECIMAL(12, 2) NOT NULL,
    `loan_recovered_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `net_payout` DECIMAL(12, 2) NOT NULL,
    `buying_center_ipc_id` INTEGER NOT NULL,
    `officer_user_id` INTEGER NOT NULL,
    `gps_latitude` DECIMAL(10, 8) NULL,
    `gps_longitude` DECIMAL(11, 8) NULL,
    `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `purchases_purchase_ref_key`(`purchase_ref`),
    INDEX `idx_purchases_farmer`(`farmer_id`),
    INDEX `idx_purchases_ref`(`purchase_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `ipc_id` INTEGER NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `capacity_tonnes` DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
    `manager_user_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `goods_received_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `grn_number` VARCHAR(30) NOT NULL,
    `warehouse_id` INTEGER NOT NULL,
    `purchase_id` INTEGER NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `quantity_received_kg` DECIMAL(10, 2) NOT NULL,
    `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
    `document_url` VARCHAR(255) NULL,
    `received_by_user_id` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `goods_received_notes_grn_number_key`(`grn_number`),
    INDEX `idx_grn_number`(`grn_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `warehouse_id` INTEGER NOT NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
    `quantity_kg` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `min_threshold_kg` DECIMAL(12, 2) NOT NULL DEFAULT 500.00,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_wh_comm_var_grade`(`warehouse_id`, `commodity_id`, `variety_id`, `grade`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `movement_type` ENUM('receipt', 'transfer_out', 'transfer_in', 'dispatch') NOT NULL,
    `source_warehouse_id` INTEGER NULL,
    `dest_warehouse_id` INTEGER NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
    `quantity_kg` DECIMAL(10, 2) NOT NULL,
    `reference_no` VARCHAR(50) NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_deliveries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `delivery_ref` VARCHAR(30) NOT NULL,
    `warehouse_id` INTEGER NOT NULL,
    `grn_id` INTEGER NULL,
    `customer_name` VARCHAR(150) NOT NULL,
    `commodity_id` INTEGER NOT NULL,
    `variety_id` INTEGER NULL,
    `quantity_kg` DECIMAL(10, 2) NOT NULL,
    `dispatch_date` DATETIME(3) NOT NULL,
    `created_by_user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customer_deliveries_delivery_ref_key`(`delivery_ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farmer_id` INTEGER NULL,
    `phone` VARCHAR(30) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('purchase_receipt', 'loan_alert', 'general') NOT NULL DEFAULT 'purchase_receipt',
    `status` ENUM('sent', 'failed', 'queued') NOT NULL DEFAULT 'sent',
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NULL,
    `entity_id` INTEGER NULL,
    `details` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_audit_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_ipc_id_fkey` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clubs_associations` ADD CONSTRAINT `clubs_associations_ipc_id_fkey` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmers` ADD CONSTRAINT `farmers_club_id_fkey` FOREIGN KEY (`club_id`) REFERENCES `clubs_associations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmers` ADD CONSTRAINT `farmers_registered_by_user_id_fkey` FOREIGN KEY (`registered_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commodity_varieties` ADD CONSTRAINT `commodity_varieties_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmer_crops` ADD CONSTRAINT `farmer_crops_farmer_id_fkey` FOREIGN KEY (`farmer_id`) REFERENCES `farmers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `farmer_crops` ADD CONSTRAINT `farmer_crops_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seed_loans` ADD CONSTRAINT `seed_loans_farmer_id_fkey` FOREIGN KEY (`farmer_id`) REFERENCES `farmers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seed_loans` ADD CONSTRAINT `seed_loans_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_farmer_id_fkey` FOREIGN KEY (`farmer_id`) REFERENCES `farmers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_buying_center_ipc_id_fkey` FOREIGN KEY (`buying_center_ipc_id`) REFERENCES `ipcs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_officer_user_id_fkey` FOREIGN KEY (`officer_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_ipc_id_fkey` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `goods_received_notes` ADD CONSTRAINT `goods_received_notes_received_by_user_id_fkey` FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_warehouse_id_fkey` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory` ADD CONSTRAINT `inventory_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_deliveries` ADD CONSTRAINT `customer_deliveries_commodity_id_fkey` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_deliveries` ADD CONSTRAINT `customer_deliveries_created_by_user_id_fkey` FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_farmer_id_fkey` FOREIGN KEY (`farmer_id`) REFERENCES `farmers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
