-- IPC Grain Traceability Management System (GTMS) Database Schema v1.0

CREATE DATABASE IF NOT EXISTS `gtms_database` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `gtms_database`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Innovation & Productivity Centres (IPCs)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `ipcs`;
CREATE TABLE `ipcs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `region` VARCHAR(50) NOT NULL,
  `location` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. System Users & Roles
-- --------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(30) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM(
    'admin', 
    'registration_officer', 
    'extension_officer', 
    'marketing_officer', 
    'warehouse_officer', 
    'ipc_manager', 
    'headoffice_manager'
  ) NOT NULL DEFAULT 'registration_officer',
  `ipc_id` INT DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  `avatar` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_ipc_id` (`ipc_id`),
  CONSTRAINT `fk_users_ipcs` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Clubs & Associations
-- --------------------------------------------------------
DROP TABLE IF EXISTS `clubs_associations`;
CREATE TABLE `clubs_associations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ipc_id` INT NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `association_name` VARCHAR(120) DEFAULT NULL,
  `zone` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_clubs_ipc` (`ipc_id`),
  CONSTRAINT `fk_clubs_ipcs` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Farmers Table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `farmers`;
CREATE TABLE `farmers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `farmer_id` VARCHAR(30) NOT NULL UNIQUE,
  `first_name` VARCHAR(60) NOT NULL,
  `last_name` VARCHAR(60) NOT NULL,
  `nrc_id` VARCHAR(50) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `club_id` INT DEFAULT NULL,
  `gps_latitude` DECIMAL(10, 8) DEFAULT NULL,
  `gps_longitude` DECIMAL(11, 8) DEFAULT NULL,
  `fingerprint_template` TEXT DEFAULT NULL,
  `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  `registered_by_user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_farmer_nrc` (`nrc_id`),
  KEY `idx_farmer_phone` (`phone`),
  KEY `idx_farmer_club` (`club_id`),
  CONSTRAINT `fk_farmers_club` FOREIGN KEY (`club_id`) REFERENCES `clubs_associations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_farmers_registered_by` FOREIGN KEY (`registered_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Commodities Catalog
-- --------------------------------------------------------
DROP TABLE IF EXISTS `commodities`;
CREATE TABLE `commodities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `unit_of_measure` VARCHAR(20) NOT NULL DEFAULT 'KG',
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `commodity_varieties`;
CREATE TABLE `commodity_varieties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `commodity_id` INT NOT NULL,
  `variety_name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_varieties_commodity` (`commodity_id`),
  CONSTRAINT `fk_varieties_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Farmer Crops
-- --------------------------------------------------------
DROP TABLE IF EXISTS `farmer_crops`;
CREATE TABLE `farmer_crops` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `farmer_id` INT NOT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `acreage_hectares` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
  `estimated_yield_kg` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `season` VARCHAR(30) DEFAULT '2026',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_farmer_crops_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_farmer_crops_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Seed Loans Table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `seed_loans`;
CREATE TABLE `seed_loans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `farmer_id` INT NOT NULL,
  `commodity_id` INT NOT NULL,
  `loan_amount` DECIMAL(12, 2) NOT NULL,
  `loan_balance` DECIMAL(12, 2) NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE DEFAULT NULL,
  `status` ENUM('active', 'paid', 'defaulted') NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_loans_farmer` (`farmer_id`),
  CONSTRAINT `fk_loans_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_loans_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Commodity Purchases
-- --------------------------------------------------------
DROP TABLE IF EXISTS `purchases`;
CREATE TABLE `purchases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `purchase_ref` VARCHAR(30) NOT NULL UNIQUE,
  `farmer_id` INT NOT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `unit_price` DECIMAL(10, 2) NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `loan_recovered_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `net_payout` DECIMAL(12, 2) NOT NULL,
  `buying_center_ipc_id` INT NOT NULL,
  `officer_user_id` INT NOT NULL,
  `gps_latitude` DECIMAL(10, 8) DEFAULT NULL,
  `gps_longitude` DECIMAL(11, 8) DEFAULT NULL,
  `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_purchases_farmer` (`farmer_id`),
  KEY `idx_purchases_ref` (`purchase_ref`),
  CONSTRAINT `fk_purchases_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_ipc` FOREIGN KEY (`buying_center_ipc_id`) REFERENCES `ipcs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_purchases_officer` FOREIGN KEY (`officer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Warehouses Table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `warehouses`;
CREATE TABLE `warehouses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `ipc_id` INT NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `capacity_tonnes` DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
  `manager_user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_warehouses_ipc` FOREIGN KEY (`ipc_id`) REFERENCES `ipcs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Goods Received Notes (GRN)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `goods_received_notes`;
CREATE TABLE `goods_received_notes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `grn_number` VARCHAR(30) NOT NULL UNIQUE,
  `warehouse_id` INT NOT NULL,
  `purchase_id` INT DEFAULT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `quantity_received_kg` DECIMAL(10, 2) NOT NULL,
  `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
  `document_url` VARCHAR(255) DEFAULT NULL,
  `received_by_user_id` INT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_grn_number` (`grn_number`),
  CONSTRAINT `fk_grn_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grn_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_grn_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_grn_user` FOREIGN KEY (`received_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Inventory Table
-- --------------------------------------------------------
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `warehouse_id` INT NOT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
  `quantity_kg` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `min_threshold_kg` DECIMAL(12, 2) NOT NULL DEFAULT 500.00,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wh_comm_var_grade` (`warehouse_id`, `commodity_id`, `variety_id`, `grade`),
  CONSTRAINT `fk_inv_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Stock Movements & Transfers
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `movement_type` ENUM('receipt', 'transfer_out', 'transfer_in', 'dispatch') NOT NULL,
  `source_warehouse_id` INT DEFAULT NULL,
  `dest_warehouse_id` INT DEFAULT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `grade` VARCHAR(20) NOT NULL DEFAULT 'Grade A',
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `reference_no` VARCHAR(50) DEFAULT NULL,
  `created_by_user_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sm_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sm_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Customer Deliveries (Final Supply Chain Link)
-- --------------------------------------------------------
DROP TABLE IF EXISTS `customer_deliveries`;
CREATE TABLE `customer_deliveries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `delivery_ref` VARCHAR(30) NOT NULL UNIQUE,
  `warehouse_id` INT NOT NULL,
  `grn_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `commodity_id` INT NOT NULL,
  `variety_id` INT DEFAULT NULL,
  `quantity_kg` DECIMAL(10, 2) NOT NULL,
  `dispatch_date` DATE NOT NULL,
  `created_by_user_id` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cd_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_commodity` FOREIGN KEY (`commodity_id`) REFERENCES `commodities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cd_user` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 14. Notifications Log
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `farmer_id` INT DEFAULT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('purchase_receipt', 'loan_alert', 'general') NOT NULL DEFAULT 'purchase_receipt',
  `status` ENUM('sent', 'failed', 'queued') NOT NULL DEFAULT 'sent',
  `sent_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notif_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 15. Audit Logs
-- --------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) DEFAULT NULL,
  `entity_id` INT DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Initial Data Seeding
-- --------------------------------------------------------

-- IPCs
INSERT INTO `ipcs` (`id`, `code`, `name`, `region`, `location`) VALUES
(1, 'IPC-LL', 'Lilongwe Innovation & Productivity Centre', 'Central', 'Lilongwe Rural'),
(2, 'IPC-MZ', 'Mzuzu Innovation & Productivity Centre', 'Northern', 'Mzuzu City'),
(3, 'IPC-BT', 'Blantyre Innovation & Productivity Centre', 'Southern', 'Blantyre Rural');

-- Users (Password for all seeded accounts: Admin123!)
-- Hash: $2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `ipc_id`, `status`) VALUES
(1, 'System Administrator', 'admin@nasfam.org.mw', '+265999000001', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'admin', 1, 'active'),
(2, 'Reg Officer John', 'regofficer@nasfam.org.mw', '+265999000002', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'registration_officer', 1, 'active'),
(3, 'Buying Officer Mary', 'buying@nasfam.org.mw', '+265999000003', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'marketing_officer', 1, 'active'),
(4, 'Warehouse Officer Peter', 'warehouse@nasfam.org.mw', '+265999000004', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'warehouse_officer', 1, 'active'),
(5, 'IPC Manager David', 'ipcmanager@nasfam.org.mw', '+265999000005', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'ipc_manager', 1, 'active'),
(6, 'Head Office Manager Sarah', 'headoffice@nasfam.org.mw', '+265999000006', '$2a$10$5pM3TzKx.B.X0qXn2.bYEuX3F9kL0g.XyD2W/z8N7v6y5x4w3v2u1', 'headoffice_manager', NULL, 'active');

-- Clubs
INSERT INTO `clubs_associations` (`id`, `ipc_id`, `name`, `association_name`, `zone`) VALUES
(1, 1, 'Chitedze Farmers Club', 'Lilongwe Smallholder Association', 'Zone A'),
(2, 1, 'Mitundu Seed Club', 'Lilongwe Smallholder Association', 'Zone B'),
(3, 2, 'Ekwendeni Grain Club', 'Mzuzu Producers Association', 'Zone Northern 1');

-- Commodities & Varieties
INSERT INTO `commodities` (`id`, `name`, `code`, `unit_of_measure`, `description`) VALUES
(1, 'Maize', 'MAZ', 'KG', 'White hybrid and local maize varieties'),
(2, 'Soya Beans', 'SOY', 'KG', 'High protein soya beans'),
(3, 'Groundnuts', 'GNT', 'KG', 'CG7 and Nsinjiro groundnut varieties'),
(4, 'Beans', 'BNS', 'KG', 'Kholophethe and mixed beans');

INSERT INTO `commodity_varieties` (`id`, `commodity_id`, `variety_name`, `description`) VALUES
(1, 1, 'SC 719 Hybrid', 'Late maturing white hybrid maize'),
(2, 1, 'DKC 80-33', 'Medium maturing maize'),
(3, 2, 'Tikwolere Soya', 'High yield soya variety'),
(4, 3, 'CG7 Groundnut', 'Popular reddish seed variety');

-- Warehouses
INSERT INTO `warehouses` (`id`, `name`, `ipc_id`, `location`, `capacity_tonnes`, `manager_user_id`) VALUES
(1, 'Lilongwe Central Warehouse', 1, 'Kanengo Industrial Area', 5000.00, 4),
(2, 'Mzuzu Regional Depot', 2, 'Luwinga Industrial Area', 3000.00, 4);

SET FOREIGN_KEY_CHECKS = 1;
