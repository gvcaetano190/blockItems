<?php
define('PLUGIN_BLOCKITEMS_VERSION', '1.0.0');

function plugin_init_blockitems() {
    global $PLUGIN_HOOKS;
    
    // CSRF compliance - OBRIGATÓRIO
    $PLUGIN_HOOKS['csrf_compliant']['blockitems'] = true;
    
    // Página de configuração
    $PLUGIN_HOOKS['config_page']['blockitems'] = 'front/config.form.php';
    
    // Adicionar JavaScript
    $PLUGIN_HOOKS['add_javascript']['blockitems'] = 'js/blockitems.js';
    
    // Hook para verificar antes de atualizar ticket
    $PLUGIN_HOOKS['pre_item_update']['blockitems'] = [
        'Ticket' => 'plugin_blockitems_pre_item_update'
    ];
}

function plugin_version_blockitems() {
    return [
        'name'           => 'Block Items Alert',
        'version'        => PLUGIN_BLOCKITEMS_VERSION,
        'author'         => 'Gabriel Caetano',
        'license'        => 'GPLv2+',
        'homepage'       => 'https://github.com/gvcaetano190/blockItems',
        'requirements'   => [
            'glpi' => [
                'min' => '10.0.0',
                'max' => '10.9.99',
            ],
            'php' => [
                'min' => '8.0',
            ]
        ]
    ];
}

function plugin_blockitems_check_prerequisites() {
    return true;
}

function plugin_blockitems_check_config($verbose = false) {
    return true;
}
