<?php
// api.php
require_once 'config.php';
require_once 'Database.php';
require_once 'Validator.php';
require_once 'RateLimiter.php';

// Set headers
foreach (Config::getHeaders() as $header => $value) {
    header("$header: $value");
}

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = Database::getInstance();
    $validator = new Validator();
    $rateLimiter = new RateLimiter($db);
    
    // Check API key if required
    if (Config::API_KEY_REQUIRED) {
        $apiKey = $_GET['api_key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? '';
        
        if (!$rateLimiter->validateApiKey($apiKey)) {
            throw new Exception('Invalid or missing API key', 401);
        }
        
        // Check rate limit
        if (!$rateLimiter->checkLimit($apiKey)) {
            throw new Exception('Rate limit exceeded. Please try again tomorrow.', 429);
        }
    }
    
    // Route handling
    $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    
    switch (true) {
        case $requestUri === '/api/track' && $requestMethod === 'POST':
            handleTrack($db, $validator, $rateLimiter);
            break;
            
        case $requestUri === '/api/batch-track' && $requestMethod === 'POST':
            handleBatchTrack($db, $validator, $rateLimiter);
            break;
            
        case $requestUri === '/api/verify' && $requestMethod === 'GET':
            handleVerify($db);
            break;
            
        case $requestUri === '/api/stats' && $requestMethod === 'GET':
            handleStats($db);
            break;
            
        default:
            throw new Exception('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'code' => $e->getCode() ?: 500,
        'timestamp' => date('c')
    ]);
}

function handleTrack($db, $validator, $rateLimiter) {
    $data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    
    if (!isset($data['phone'])) {
        throw new Exception('Phone number is required', 400);
    }
    
    $phone = $validator->sanitizePhone($data['phone']);
    
    // Validate phone number
    if (!$validator->validatePhone($phone)) {
        throw new Exception('Invalid phone number format', 400);
    }
    
    // Check if number is in blacklist
    if ($db->isBlacklisted($phone)) {
        throw new Exception('This number has been reported as spam', 403);
    }
    
    // Track phone number
    $result = trackPhoneNumber($phone, $db, $validator);
    
    // Log the request
    $logData = [
        'phone_number' => $phone,
        'formatted_number' => $result['formatted'],
        'request_ip' => $_SERVER['REMOTE_ADDR'],
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
        'api_key' => $apiKey ?? 'anonymous',
        'success' => true
    ];
    
    $db->logTracking($logData);
    
    // Update rate limit
    if (isset($apiKey)) {
        $rateLimiter->incrementRequest($apiKey);
    }
    
    // Return response
    echo json_encode([
        'success' => true,
        'data' => $result,
        'meta' => [
            'request_id' => uniqid('req_'),
            'processed_at' => date('c'),
            'cached' => false
        ]
    ]);
}

function trackPhoneNumber($phone, $db, $validator) {
    // Check cache first
    $cacheKey = 'track_' . md5($phone);
    $cachedResult = $db->getCache($cacheKey);
    
    if ($cachedResult && Config::CACHE_ENABLED) {
        $cachedResult['meta']['cached'] = true;
        return $cachedResult;
    }
    
    // Get operator information
    $operator = $db->getOperatorByPrefix($phone);
    
    // Get area information
    $area = $db->getAreaByPhone($phone);
    
    // Get porting information
    $porting = $db->getPortingInfo($phone);
    
    // Check blacklist status
    $blacklistInfo = $db->getBlacklistInfo($phone);
    
    // Get additional info from external APIs
    $externalInfo = getExternalInfo($phone);
    
    // Calculate confidence score
    $confidenceScore = calculateConfidenceScore($operator, $area, $porting);
    
    // Format the result
    $result = [
        'phone' => [
            'raw' => $phone,
            'formatted' => $validator->formatPhone($phone),
            'international' => $validator->formatInternational($phone),
            'e164' => $validator->formatE164($phone)
        ],
        'operator' => $operator,
        'location' => $area,
        'porting' => $porting,
        'status' => [
            'is_active' => determineActiveStatus($phone),
            'is_ported' => $porting ? true : false,
            'is_blacklisted' => !empty($blacklistInfo),
            'confidence_score' => $confidenceScore
        ],
        'additional_info' => $externalInfo,
        'meta' => [
            'source' => 'internal_database',
            'last_updated' => date('c')
        ]
    ];
    
    // Cache the result
    $db->setCache($cacheKey, $result, Config::CACHE_EXPIRY);
    
    return $result;
}

function getExternalInfo($phone) {
    $info = [];
    
    // Example: Using NumVerify API (requires subscription)
    if (Config::NUMVERIFY_API_KEY) {
        $url = "http://apilayer.net/api/validate?access_key=" . 
               Config::NUMVERIFY_API_KEY . "&number=" . urlencode($phone);
        
        $response = @file_get_contents($url);
        
        if ($response) {
            $data = json_decode($response, true);
            if ($data && $data['valid']) {
                $info['numverify'] = [
                    'valid' => $data['valid'],
                    'number' => $data['number'],
                    'local_format' => $data['local_format'],
                    'international_format' => $data['international_format'],
                    'country_prefix' => $data['country_prefix'],
                    'country_code' => $data['country_code'],
                    'country_name' => $data['country_name'],
                    'location' => $data['location'],
                    'carrier' => $data['carrier'],
                    'line_type' => $data['line_type']
                ];
            }
        }
    }
    
    // Example: Using OpenCage for geocoding
    if (Config::OPENCAGE_API_KEY && isset($info['numverify']['location'])) {
        $url = "https://api.opencagedata.com/geocode/v1/json?q=" . 
               urlencode($info['numverify']['location']) . 
               "&key=" . Config::OPENCAGE_API_KEY;
        
        $response = @file_get_contents($url);
        
        if ($response) {
            $data = json_decode($response, true);
            if ($data && $data['results']) {
                $info['geocoding'] = $data['results'][0];
            }
        }
    }
    
    return $info;
}

function calculateConfidenceScore($operator, $area, $porting) {
    $score = 0;
    
    if ($operator) $score += 40;
    if ($area) $score += 30;
    if ($porting) $score += 20;
    
    // Add random factor for simulation
    $score += rand(0, 10);
    
    return min($score, 100);
}

function determineActiveStatus($phone) {
    // In real implementation, this would check with carrier
    // For demo, return random status
    return rand(0, 100) > 20;
}

// Database class
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        $this->connection = new mysqli(
            Config::DB_HOST,
            Config::DB_USER,
            Config::DB_PASS,
            Config::DB_NAME
        );
        
        if ($this->connection->connect_error) {
            throw new Exception("Connection failed: " . $this->connection->connect_error);
        }
        
        $this->connection->set_charset(Config::DB_CHARSET);
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getOperatorByPrefix($phone) {
        $prefixes = [substr($phone, 0, 4), substr($phone, 0, 3), substr($phone, 0, 2)];
        
        foreach ($prefixes as $prefix) {
            $stmt = $this->connection->prepare(
                "SELECT * FROM operators WHERE prefix = ? AND status = 'active' LIMIT 1"
            );
            $stmt->bind_param('s', $prefix);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                return $result->fetch_assoc();
            }
        }
        
        return null;
    }
    
    public function getAreaByPhone($phone) {
        // This would normally involve more complex logic
        // For demo, return simple area detection
        return ['city' => 'Jakarta', 'province' => 'DKI Jakarta', 'timezone' => 'WIB'];
    }
    
    // ... other database methods
}

// Validator class
class Validator {
    public function sanitizePhone($phone) {
        // Remove all non-digit characters except plus
        $phone = preg_replace('/[^\d\+]/', '', $phone);
        
        // Handle Indonesian numbers
        if (strpos($phone, '0') === 0) {
            // Convert 08 to +628
            $phone = '+62' . substr($phone, 1);
        } elseif (strpos($phone, '62') === 0) {
            $phone = '+' . $phone;
        } elseif (strpos($phone, '+') !== 0) {
            // Assume it's international without country code
            $phone = '+' . $phone;
        }
        
        return $phone;
    }
    
    public function validatePhone($phone) {
        // Basic validation
        if (empty($phone) || strlen($phone) < 10) {
            return false;
        }
        
        // Validate with libphonenumber if available
        if (class_exists('libphonenumber\PhoneNumberUtil')) {
            try {
                $phoneUtil = \libphonenumber\PhoneNumberUtil::getInstance();
                $numberProto = $phoneUtil->parse($phone, null);
                return $phoneUtil->isValidNumber($numberProto);
            } catch (\Exception $e) {
                return false;
            }
        }
        
        // Fallback regex validation
        $pattern = '/^\+[1-9]\d{1,14}$/';
        return preg_match($pattern, $phone);
    }
    
    public function formatPhone($phone) {
        // Format to Indonesian style
        $clean = preg_replace('/\D/', '', $phone);
        
        if (strpos($clean, '62') === 0) {
            $clean = '0' . substr($clean, 2);
        }
        
        return $clean;
    }
}
?>
