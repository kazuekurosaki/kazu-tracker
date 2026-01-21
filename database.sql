-- database.sql
CREATE DATABASE IF NOT EXISTS phone_tracker;
USE phone_tracker;

-- Tabel operator telekomunikasi
CREATE TABLE operators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prefix VARCHAR(10) NOT NULL,
    operator_name VARCHAR(100) NOT NULL,
    operator_code VARCHAR(50),
    operator_type ENUM('gsm', 'cdma', 'lte', 'satelit') DEFAULT 'gsm',
    launch_year YEAR,
    website VARCHAR(255),
    status ENUM('active', 'inactive', 'merged') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prefix (prefix),
    UNIQUE KEY unique_prefix (prefix)
);

-- Tabel kode area
CREATE TABLE area_codes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    area_code VARCHAR(10) NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    timezone VARCHAR(50),
    population INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_area_code (area_code)
);

-- Tabel pelacakan history
CREATE TABLE tracking_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    formatted_number VARCHAR(25),
    operator_id INT,
    area_id INT,
    carrier_name VARCHAR(100),
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accuracy VARCHAR(50),
    device_type VARCHAR(100),
    connection_type VARCHAR(50),
    status ENUM('active', 'inactive', 'porting', 'unknown') DEFAULT 'unknown',
    is_ported BOOLEAN DEFAULT FALSE,
    ported_from VARCHAR(100),
    confidence_score INT DEFAULT 0,
    request_ip VARCHAR(45),
    user_agent TEXT,
    request_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone_number),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (operator_id) REFERENCES operators(id),
    FOREIGN KEY (area_id) REFERENCES area_codes(id)
);

-- Tabel blacklist (untuk nomor spam)
CREATE TABLE blacklist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) NOT NULL,
    report_count INT DEFAULT 1,
    report_type ENUM('spam', 'scam', 'fraud', 'harassment', 'other') DEFAULT 'spam',
    first_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100),
    notes TEXT,
    UNIQUE KEY unique_phone (phone_number),
    INDEX idx_report_type (report_type)
);

-- Tabel users (untuk admin)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'moderator', 'user') DEFAULT 'user',
    api_key VARCHAR(64) UNIQUE,
    daily_limit INT DEFAULT 100,
    total_requests INT DEFAULT 0,
    last_request DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_key (api_key)
);

-- Insert data operator
INSERT INTO operators (prefix, operator_name, operator_code, operator_type, launch_year) VALUES
('0811', 'Telkomsel', 'TSEL', 'gsm', 1995),
('0812', 'Telkomsel', 'TSEL', 'gsm', 1995),
('0813', 'Telkomsel', 'TSEL', 'gsm', 1995),
('0821', 'Telkomsel', 'TSEL', 'gsm', 1995),
('0822', 'Telkomsel', 'TSEL', 'gsm', 1995),
('0823', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0852', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0853', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0814', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0815', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0816', 'Telkomsel', 'TSEL', 'gsm', 2006),
('0855', 'Indosat Ooredoo', 'ISAT', 'gsm', 1994),
('0856', 'Indosat Ooredoo', 'ISAT', 'gsm', 1994),
('0857', 'Indosat Ooredoo', 'ISAT', 'gsm', 1994),
('0858', 'Indosat Ooredoo', 'ISAT', 'gsm', 1994),
('0817', 'XL Axiata', 'EXCL', 'gsm', 1996),
('0818', 'XL Axiata', 'EXCL', 'gsm', 1996),
('0819', 'XL Axiata', 'EXCL', 'gsm', 1996),
('0859', 'XL Axiata', 'EXCL', 'gsm', 1996),
('0877', 'XL Axiata', 'EXCL', 'gsm', 2006),
('0878', 'XL Axiata', 'EXCL', 'gsm', 2006),
('0881', 'Smartfren', 'FREN', 'cdma', 2006),
('0882', 'Smartfren', 'FREN', 'cdma', 2006),
('0883', 'Smartfren', 'FREN', 'lte', 2014),
('0884', 'Smartfren', 'FREN', 'lte', 2014),
('0885', 'Smartfren', 'FREN', 'lte', 2014),
('0886', 'Smartfren', 'FREN', 'lte', 2014),
('0887', 'Smartfren', 'FREN', 'lte', 2014),
('0888', 'Smartfren', 'FREN', 'lte', 2014),
('0889', 'Smartfren', 'FREN', 'lte', 2014),
('0895', '3 (Tri)', 'TIS', 'gsm', 2007),
('0896', '3 (Tri)', 'TIS', 'gsm', 2007),
('0897', '3 (Tri)', 'TIS', 'gsm', 2007),
('0898', '3 (Tri)', 'TIS', 'gsm', 2007),
('0899', '3 (Tri)', 'TIS', 'gsm', 2007),
('0891', 'By.U (Telkomsel)', 'TSEL', 'gsm', 2020),
('0890', 'By.U (Telkomsel)', 'TSEL', 'gsm', 2020);

-- Insert data kode area
INSERT INTO area_codes (area_code, province, city, region, timezone) VALUES
('021', 'DKI Jakarta', 'Jakarta', 'Jabodetabek', 'WIB'),
('022', 'Jawa Barat', 'Bandung', 'Parahyangan', 'WIB'),
('024', 'Jawa Tengah', 'Semarang', 'Ungaran', 'WIB'),
('0271', 'Jawa Tengah', 'Surakarta', 'Solo Raya', 'WIB'),
('0274', 'DI Yogyakarta', 'Yogyakarta', 'Mataram', 'WIB'),
('0281', 'Jawa Tengah', 'Purwokerto', 'Banyumas', 'WIB'),
('0282', 'Jawa Tengah', 'Cilacap', 'Banyumas', 'WIB'),
('0283', 'Jawa Tengah', 'Brebes', 'Pantura', 'WIB'),
('0285', 'Jawa Tengah', 'Jepara', 'Pantura', 'WIB'),
('0287', 'Jawa Tengah', 'Kudus', 'Pantura', 'WIB'),
('031', 'Jawa Timur', 'Surabaya', 'Gerbangkertosusila', 'WIB'),
('0321', 'Jawa Timur', 'Sidoarjo', 'Gerbangkertosusila', 'WIB'),
('0322', 'Jawa Timur', 'Mojokerto', 'Gerbangkertosusila', 'WIB'),
('0323', 'Jawa Timur', 'Jombang', 'Kediri Raya', 'WIB'),
('0328', 'Jawa Timur', 'Bondowoso', 'Tapal Kuda', 'WIB'),
('0331', 'Jawa Timur', 'Jember', 'Tapal Kuda', 'WIB'),
('0333', 'Jawa Timur', 'Banyuwangi', 'Tapal Kuda', 'WIB'),
('0341', 'Jawa Timur', 'Malang', 'Malang Raya', 'WIB'),
('0351', 'Jawa Timur', 'Madiun', 'Madiun Raya', 'WIB'),
('0361', 'Bali', 'Denpasar', 'Bali', 'WITA'),
('0370', 'NTB', 'Mataram', 'Mataram', 'WITA'),
('0411', 'Sulawesi Selatan', 'Makassar', 'Makassar', 'WITA'),
('0431', 'Sulawesi Utara', 'Manado', 'Manado', 'WITA'),
('0511', 'Kalimantan Selatan', 'Banjarmasin', 'Banjar', 'WITA'),
('0521', 'Kalimantan Timur', 'Samarinda', 'Samarinda', 'WITA'),
('0541', 'Kalimantan Timur', 'Balikpapan', 'Balikpapan', 'WITA'),
('0561', 'Kalimantan Barat', 'Pontianak', 'Pontianak', 'WIB'),
('061', 'Sumatera Utara', 'Medan', 'Medan', 'WIB'),
('0711', 'Sumatera Selatan', 'Palembang', 'Palembang', 'WIB'),
('0731', 'Bengkulu', 'Bengkulu', 'Bengkulu', 'WIB'),
('0751', 'Sumatera Barat', 'Padang', 'Padang', 'WIB'),
('0761', 'Riau', 'Pekanbaru', 'Pekanbaru', 'WIB');

-- Insert admin user
INSERT INTO users (username, email, password_hash, role, api_key) VALUES
('admin', 'admin@phonetracker.id', '$2y$10$YourHashedPasswordHere', 'admin', 'admin_apikey_123456');
