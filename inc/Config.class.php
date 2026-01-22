<?php

if (!defined('GLPI_ROOT')) {
    die("Sorry. You can't access this file directly");
}

class PluginBlockitemsConfig extends CommonDBTM {
    
    static $rightname = 'config';
    
    /**
     * Obtém configuração atual
     */
    static function getConfig() {
        global $DB;
        
        if (!$DB->tableExists('glpi_plugin_blockitems_config')) {
            return [
                'enable_alert' => true,
                'enable_logs'  => true
            ];
        }
        
        $result = $DB->request([
            'SELECT' => '*',
            'FROM'   => 'glpi_plugin_blockitems_config',
            'LIMIT'  => 1
        ]);
        
        if ($result->count()) {
            $data = $result->current();
            return [
                'enable_alert' => (bool) $data['enable_alert'],
                'enable_logs'  => (bool) $data['enable_logs']
            ];
        }
        
        return [
            'enable_alert' => true,
            'enable_logs'  => true
        ];
    }
    
    /**
     * Atualiza configuração
     */
    static function setConfig($enable_alert, $enable_logs) {
        global $DB;
        
        if (!$DB->tableExists('glpi_plugin_blockitems_config')) {
            return false;
        }
        
        return $DB->update(
            'glpi_plugin_blockitems_config',
            [
                'enable_alert' => $enable_alert ? 1 : 0,
                'enable_logs'  => $enable_logs ? 1 : 0
            ],
            ['id' => 1]
        );
    }
}
