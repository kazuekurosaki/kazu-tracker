<?php
// config.php
class Config {
    // Database Configuration
    const DB_HOST = 'localhost';
    const DB_NAME = 'phone_tracker';
    const DB_USER = 'root';
    const DB_PASS = '';
    const DB_CHARSET = 'utf8mb4';
    
    // API Configuration
    const API_RATE_LIMIT = 100; // Requests per day
    const API_KEY_REQUIRED = true;
    const API_VERSION = '1.0.0';
    
    // Security Configuration
    const ENCRYPTION_KEY = 'your-secret-key-here';
    const JWT_SECRET = 'your-jwt-secret-here';
    const ALLOWED_IPS = ['127.0.0.1', '::1'];
    
    // External API Keys (contoh)
    const GOOGLE_MAPS_API_KEY = 'AIzaSyYourGoogleMapsAPIKey';
    const OPENCAGE_API_KEY = 'your-opencage-api-key';
    const NUMVERIFY_API_KEY = 'your-numverify-api-key';
    
    // Application Settings
    const SITE_NAME = 'Phone Tracker Indonesia';
    const SITE_URL = 'https://phonetracker.id';
    const CONTACT_EMAIL = 'support@phonetracker.id';
    const MAX_REQUESTS_PER_MINUTE = 10;
    
    // Cache Settings
    const CACHE_ENABLED = true;
    const CACHE_EXPIRY = 3600; // 1 hour in seconds
    
    // Logging Settings
    const LOG_ENABLED = true;
    const LOG_FILE = __DIR__ . '/logs/tracking.log';
    
    public static function getTimezone() {
        return 'Asia/Jakarta';
    }
    
    public static function getHeaders() {
        return [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type' => 'application/json',
            'X-API-Version' => self::API_VERSION,
            'X-RateLimit-Limit' => self::API_RATE_LIMIT
        ];
    }
}

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/error.log');

// Set timezone
date_default_timezone_set(Config::getTimezone());

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
