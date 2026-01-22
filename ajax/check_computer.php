<?php
/**
 * BlockItems - AJAX endpoint para verificar se ticket tem Computer
 */

include('../../../inc/includes.php');

header('Content-Type: application/json');

// Verificar sessão
Session::checkLoginUser();

$ticket_id = isset($_GET['ticket_id']) ? (int) $_GET['ticket_id'] : 0;

if ($ticket_id <= 0) {
    echo json_encode(['error' => 'ID do ticket inválido', 'has_computer' => true]);
    exit;
}

// Verificar se há Computer vinculado
global $DB;

$result = $DB->request([
    'SELECT' => ['id'],
    'FROM'   => 'glpi_items_tickets',
    'WHERE'  => [
        'tickets_id' => $ticket_id,
        'itemtype'   => 'Computer'
    ],
    'LIMIT'  => 1
]);

$has_computer = ($result->count() > 0);

// Log se não tem computador
if (!$has_computer) {
    // Verificar se logs estão habilitados
    $log_enabled = true;
    if ($DB->tableExists('glpi_plugin_blockitems_config')) {
        $config_result = $DB->request([
            'SELECT' => ['enable_logs'],
            'FROM'   => 'glpi_plugin_blockitems_config',
            'LIMIT'  => 1
        ]);
        if ($config_result->count()) {
            $config = $config_result->current();
            $log_enabled = (bool) $config['enable_logs'];
        }
    }
    
    if ($log_enabled) {
        Toolbox::logInFile('blockitems', 
            "Alerta exibido - Ticket #$ticket_id sem computador vinculado\n"
        );
    }
}

echo json_encode([
    'has_computer' => $has_computer,
    'ticket_id'    => $ticket_id
]);
