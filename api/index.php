<?php
// Simple API endpoint for Vercel deployment
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple in-memory storage (for demo - in production use database)
$dataFile = '/tmp/activities.json';
$usersFile = '/tmp/users.json';
$sessionFile = '/tmp/session.json';

function loadActivities() {
    global $dataFile;
    if (file_exists($dataFile)) {
        return json_decode(file_get_contents($dataFile), true) ?: [];
    }
    return [];
}

function saveActivities($activities) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($activities));
}

function loadUsers() {
    global $usersFile;
    if (file_exists($usersFile)) {
        return json_decode(file_get_contents($usersFile), true) ?: [];
    }
    return [];
}

function saveUsers($users) {
    global $usersFile;
    file_put_contents($usersFile, json_encode($users));
}

function getCurrentUser() {
    global $sessionFile;
    if (file_exists($sessionFile)) {
        $session = json_decode(file_get_contents($sessionFile), true);
        if ($session && isset($session['user_id'])) {
            $users = loadUsers();
            foreach ($users as $user) {
                if ($user['id'] === $session['user_id']) {
                    return $user;
                }
            }
        }
    }
    return null;
}

function setCurrentUser($userId) {
    global $sessionFile;
    file_put_contents($sessionFile, json_encode(['user_id' => $userId]));
}

function clearCurrentUser() {
    global $sessionFile;
    if (file_exists($sessionFile)) {
        unlink($sessionFile);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

switch ($method) {
    case 'GET':
        if ($path === 'activities') {
            $user = getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                break;
            }
            echo json_encode(loadActivities());
        } elseif ($path === 'user') {
            $user = getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                break;
            }
            echo json_encode($user);
        } elseif ($path === 'sanctum/csrf-cookie') {
            // Fake CSRF endpoint for compatibility
            echo json_encode(['success' => true]);
        } elseif ($path === 'clear-session') {
            // Endpoint na vyčistenie session - len pre debug
            clearCurrentUser();
            // Vyčistiť aj súbory
            $files = ['/tmp/session.json', '/tmp/users.json', '/tmp/activities.json'];
            foreach ($files as $file) {
                if (file_exists($file)) {
                    unlink($file);
                }
            }
            echo json_encode(['message' => 'Session cleared']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;
        
    case 'POST':
        if ($path === 'activities') {
            $user = getCurrentUser();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Unauthorized']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $activities = loadActivities();
            
            $newActivity = [
                'id' => time(),
                'name' => $input['name'],
                'distance' => $input['distance'],
                'duration' => $input['duration'],
                'started_at' => $input['started_at'],
                'notes' => $input['notes'] ?? '',
                'user_id' => $user['id'],
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            array_unshift($activities, $newActivity);
            saveActivities($activities);
            
            echo json_encode($newActivity);
        } elseif ($path === 'register') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Validácia
            if (empty($input['name']) || empty($input['email']) || empty($input['password'])) {
                http_response_code(422);
                echo json_encode([
                    'message' => 'Validation failed',
                    'errors' => [
                        'name' => empty($input['name']) ? ['Meno je povinné'] : [],
                        'email' => empty($input['email']) ? ['Email je povinný'] : [],
                        'password' => empty($input['password']) ? ['Heslo je povinné'] : []
                    ]
                ]);
                break;
            }
            
            if ($input['password'] !== $input['password_confirmation']) {
                http_response_code(422);
                echo json_encode([
                    'message' => 'Validation failed',
                    'errors' => [
                        'password_confirmation' => ['Heslá sa nezhodujú']
                    ]
                ]);
                break;
            }
            
            $users = loadUsers();
            
            // Kontrola či email už existuje
            foreach ($users as $user) {
                if ($user['email'] === $input['email']) {
                    http_response_code(422);
                    echo json_encode([
                        'message' => 'Validation failed',
                        'errors' => [
                            'email' => ['Email už existuje']
                        ]
                    ]);
                    exit;
                }
            }
            
            // Vytvorenie nového používateľa
            $newUser = [
                'id' => count($users) + 1,
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => password_hash($input['password'], PASSWORD_DEFAULT),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            $users[] = $newUser;
            saveUsers($users);
            
            // Automatické prihlásenie
            setCurrentUser($newUser['id']);
            
            // Vrátiť používateľa bez hesla
            unset($newUser['password']);
            echo json_encode($newUser);
            
        } elseif ($path === 'login') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (empty($input['email']) || empty($input['password'])) {
                http_response_code(422);
                echo json_encode([
                    'message' => 'Email a heslo sú povinné'
                ]);
                break;
            }
            
            $users = loadUsers();
            
            foreach ($users as $user) {
                if ($user['email'] === $input['email'] && password_verify($input['password'], $user['password'])) {
                    setCurrentUser($user['id']);
                    unset($user['password']);
                    echo json_encode($user);
                    exit;
                }
            }
            
            http_response_code(401);
            echo json_encode(['message' => 'Nesprávny email alebo heslo']);
            
        } elseif ($path === 'logout') {
            clearCurrentUser();
            echo json_encode(['message' => 'Úspešne odhlásený']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;
        
    case 'DELETE':
        if (preg_match('/activities\/(\d+)/', $path, $matches)) {
            $id = (int)$matches[1];
            $activities = loadActivities();
            
            $activities = array_filter($activities, function($activity) use ($id) {
                return $activity['id'] !== $id;
            });
            
            saveActivities(array_values($activities));
            echo json_encode(['message' => 'Activity deleted']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>
