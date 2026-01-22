<?php

function plugin_blockitems_install() {
    global $DB;
    
    if (!$DB->tableExists('glpi_plugin_blockitems_config')) {
        $query = "CREATE TABLE `glpi_plugin_blockitems_config` (
            `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
            `enable_alert` tinyint(1) DEFAULT 1,
            `enable_logs` tinyint(1) DEFAULT 1,
            `created_at` datetime DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
        
        $DB->query($query);
        
        if ($DB->tableExists('glpi_plugin_blockitems_config')) {
            $DB->insert('glpi_plugin_blockitems_config', [
                'enable_alert' => 1,
                'enable_logs'  => 1
            ]);
        }
    }
    
    return true;
}

function plugin_blockitems_uninstall() {
    global $DB;
    
    if ($DB->tableExists('glpi_plugin_blockitems_config')) {
        $DB->query("DROP TABLE `glpi_plugin_blockitems_config`");
    }
    
    return true;
}

/**
 * Hook pre_item_update - Verifica se ticket tem Computer vinculado
 */
function plugin_blockitems_pre_item_update($item) {
    global $DB;
    
    // Verificar se plugin está habilitado
    if (!plugin_blockitems_isEnabled()) {
        return;
    }
    
    $ticket_id = $item->getID();
    
    // Status: SOLVED=5, CLOSED=6
    $SOLVED_STATUS = 5;
    $CLOSED_STATUS = 6;
    
    // Verificar se está mudando para Solucionado ou Fechado
    $new_status = isset($item->input['status']) ? (int) $item->input['status'] : null;
    
    if ($new_status !== $SOLVED_STATUS && $new_status !== $CLOSED_STATUS) {
        return; // Não está solucionando nem fechando
    }
    
    // Verificar se há Computer vinculado
    $has_computer = plugin_blockitems_hasComputer($ticket_id);
    
    if (!$has_computer) {
        // Adicionar flag para JavaScript exibir alerta
        $_SESSION['plugin_blockitems_alert'] = [
            'ticket_id' => $ticket_id,
            'status'    => $new_status,
            'message'   => 'Este chamado não possui computador vinculado.'
        ];
        
        // Log
        if (plugin_blockitems_isLogsEnabled()) {
            Toolbox::logInFile('blockitems', 
                "Alerta exibido - Ticket #$ticket_id sem computador vinculado\n"
            );
        }
    }
}

/**
 * Verifica se ticket tem Computer vinculado
 */
function plugin_blockitems_hasComputer($ticket_id) {
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
    
    return ($result->count() > 0);
}

/**
 * Verifica se plugin está habilitado
 */
function plugin_blockitems_isEnabled() {
    global $DB;
    
    if (!$DB->tableExists('glpi_plugin_blockitems_config')) {
        return false;
    }
    
    $result = $DB->request([
        'SELECT' => ['enable_alert'],
        'FROM'   => 'glpi_plugin_blockitems_config',
        'LIMIT'  => 1
    ]);
    
    if (!$result->count()) {
        return true;
    }
    
    $config = $result->current();
    return (bool) $config['enable_alert'];
}

/**
 * Verifica se logs estão habilitados
 */
function plugin_blockitems_isLogsEnabled() {
    global $DB;
    
    if (!$DB->tableExists('glpi_plugin_blockitems_config')) {
        return true;
    }
    
    $result = $DB->request([
        'SELECT' => ['enable_logs'],
        'FROM'   => 'glpi_plugin_blockitems_config',
        'LIMIT'  => 1
    ]);
    
    if (!$result->count()) {
        return true;
    }
    
    $config = $result->current();
    return (bool) $config['enable_logs'];
}
