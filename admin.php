<?php
// admin.php
require_once 'config.php';
require_once 'Database.php';

class AdminPanel {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->checkAuth();
    }
    
    private function checkAuth() {
        session_start();
        
        if (!isset($_SESSION['admin_logged_in']) || !$_SESSION['admin_logged_in']) {
            header('Location: login.php');
            exit;
        }
    }
    
    public function render() {
        $page = $_GET['page'] ?? 'dashboard';
        
        switch ($page) {
            case 'dashboard':
                $this->renderDashboard();
                break;
            case 'tracking_logs':
                $this->renderTrackingLogs();
                break;
            case 'blacklist':
                $this->renderBlacklist();
                break;
            case 'users':
                $this->renderUsers();
                break;
            case 'analytics':
                $this->renderAnalytics();
                break;
            case 'settings':
                $this->renderSettings();
                break;
            default:
                $this->renderDashboard();
        }
    }
    
    private function renderDashboard() {
        $stats = $this->db->getDashboardStats();
        ?>
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Admin Panel - Phone Tracker</title>
            <style>
                /* Admin CSS Styles */
            </style>
        </head>
        <body>
            <div class="admin-container">
                <!-- Sidebar -->
                <div class="sidebar">
                    <h2>📱 Admin Panel</h2>
                    <ul>
                        <li><a href="?page=dashboard">Dashboard</a></li>
                        <li><a href="?page=tracking_logs">Tracking Logs</a></li>
                        <li><a href="?page=blacklist">Blacklist</a></li>
                        <li><a href="?page=users">Users</a></li>
                        <li><a href="?page=analytics">Analytics</a></li>
                        <li><a href="?page=settings">Settings</a></li>
                        <li><a href="logout.php">Logout</a></li>
                    </ul>
                </div>
                
                <!-- Main Content -->
                <div class="main-content">
                    <h1>Dashboard</h1>
                    
                    <!-- Stats Cards -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total Tracking</h3>
                            <p><?= number_format($stats['total_tracking']) ?></p>
                        </div>
                        <div class="stat-card">
                            <h3>Today's Requests</h3>
                            <p><?= number_format($stats['today_requests']) ?></p>
                        </div>
                        <div class="stat-card">
                            <h3>Blacklisted Numbers</h3>
                            <p><?= number_format($stats['blacklisted']) ?></p>
                        </div>
                        <div class="stat-card">
                            <h3>Active Users</h3>
                            <p><?= number_format($stats['active_users']) ?></p>
                        </div>
                    </div>
                    
                    <!-- Recent Activity -->
                    <div class="recent-activity">
                        <h2>Recent Activity</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Phone Number</th>
                                    <th>IP Address</th>
                                    <th>Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($stats['recent_activity'] as $activity): ?>
                                <tr>
                                    <td><?= $activity['time'] ?></td>
                                    <td><?= htmlspecialchars($activity['phone']) ?></td>
                                    <td><?= $activity['ip'] ?></td>
                                    <td><?= $activity['result'] ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </body>
        </html>
        <?php
    }
    
    // ... other methods for different pages
}

// Initialize and render admin panel
$admin = new AdminPanel();
$admin->render();
?>
