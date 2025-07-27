<?php
// Simple API endpoint for Vercel deployment
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple in-memory storage (for demo - in production use database)
$dataFile = '/tmp/activities.json';

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

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

switch ($method) {
    case 'GET':
        if ($path === 'activities') {
            echo json_encode(loadActivities());
        } elseif ($path === 'user') {
            echo json_encode(['id' => 1, 'name' => 'Demo User', 'email' => 'demo@example.com']);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;
        
    case 'POST':
        if ($path === 'activities') {
            $input = json_decode(file_get_contents('php://input'), true);
            $activities = loadActivities();
            
            $newActivity = [
                'id' => time(),
                'name' => $input['name'],
                'distance' => $input['distance'],
                'duration' => $input['duration'],
                'started_at' => $input['started_at'],
                'notes' => $input['notes'] ?? '',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            array_unshift($activities, $newActivity);
            saveActivities($activities);
            
            echo json_encode($newActivity);
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
