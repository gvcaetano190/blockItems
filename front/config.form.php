<?php
include('../../../inc/includes.php');

Session::checkRight('config', READ);

// Processar formulário
if (isset($_POST['update'])) {
    Session::checkRight('config', UPDATE);
    
    global $DB;
    
    if ($DB->tableExists('glpi_plugin_blockitems_config')) {
        $DB->update(
            'glpi_plugin_blockitems_config',
            [
                'enable_alert' => isset($_POST['enable_alert']) ? 1 : 0,
                'enable_logs'  => isset($_POST['enable_logs']) ? 1 : 0
            ],
            ['id' => 1]
        );
        
        Session::addMessageAfterRedirect(
            __('Configurações salvas!', 'blockitems'),
            true,
            INFO
        );
    }
    
    Html::redirect($_SERVER['PHP_SELF']);
}

// Obter configurações
global $DB;
$config = ['enable_alert' => true, 'enable_logs' => true];

if ($DB->tableExists('glpi_plugin_blockitems_config')) {
    $result = $DB->request([
        'SELECT' => '*',
        'FROM'   => 'glpi_plugin_blockitems_config',
        'LIMIT'  => 1
    ]);
    
    if ($result->count()) {
        $data = $result->current();
        $config = [
            'enable_alert' => (bool) $data['enable_alert'],
            'enable_logs'  => (bool) $data['enable_logs']
        ];
    }
}

Html::header('BlockItems', $_SERVER['PHP_SELF'], 'config', 'plugins');

echo "<div class='center'>";
echo "<h2>BlockItems - Configurações</h2>";
echo "</div>";

echo "<form method='post' action='" . $_SERVER['PHP_SELF'] . "'>";
echo Html::hidden('_glpi_csrf_token', ['value' => Session::getNewCSRFToken()]);

echo "<div class='center' style='margin-top: 20px;'>";
echo "<table class='tab_cadre_fixe'>";

echo "<tr class='tab_bg_1'>";
echo "<th colspan='2'>Configurações do Alerta</th>";
echo "</tr>";

echo "<tr class='tab_bg_1'>";
echo "<td>Habilitar Alerta</td>";
echo "<td>";
echo "<input type='checkbox' name='enable_alert' value='1' " . ($config['enable_alert'] ? 'checked' : '') . ">";
echo " <small>Exibe alerta ao solucionar/fechar sem computador</small>";
echo "</td>";
echo "</tr>";

echo "<tr class='tab_bg_1'>";
echo "<td>Habilitar Logs</td>";
echo "<td>";
echo "<input type='checkbox' name='enable_logs' value='1' " . ($config['enable_logs'] ? 'checked' : '') . ">";
echo " <small>Registra alertas em /files/_log/blockitems.log</small>";
echo "</td>";
echo "</tr>";

echo "<tr class='tab_bg_1'>";
echo "<td colspan='2' class='center'>";
echo "<input type='submit' name='update' value='Salvar' class='btn btn-primary'>";
echo "</td>";
echo "</tr>";

echo "</table>";
echo "</div>";

echo Html::closeForm(false);

// Info
echo "<div class='center' style='margin-top: 30px;'>";
echo "<table class='tab_cadre_fixe'>";
echo "<tr class='tab_bg_1'><th colspan='2'>Informações</th></tr>";
echo "<tr class='tab_bg_1'><td>Versão</td><td><strong>" . PLUGIN_BLOCKITEMS_VERSION . "</strong></td></tr>";
echo "<tr class='tab_bg_1'><td>Autor</td><td>Gabriel Caetano</td></tr>";
echo "<tr class='tab_bg_1'><th colspan='2'>Descrição</th></tr>";
echo "<tr class='tab_bg_1'><td colspan='2'>";
echo "<p>Este plugin exibe um alerta quando o usuário tenta solucionar ou fechar um chamado sem ter um computador vinculado.</p>";
echo "<p><strong>Comportamento:</strong></p>";
echo "<ul style='text-align: left; margin-left: 40px;'>";
echo "<li>⚠️ Exibe alerta (não bloqueia)</li>";
echo "<li>✅ Permite continuar mesmo assim</li>";
echo "<li>❌ Permite cancelar a ação</li>";
echo "</ul>";
echo "</td></tr>";
echo "</table>";
echo "</div>";

Html::footer();
