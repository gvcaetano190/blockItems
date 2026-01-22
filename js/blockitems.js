/**
 * BlockItems - JavaScript para exibir alerta
 */
(function() {
    'use strict';
    
    // Verificar se estamos na página de ticket
    if (!window.location.href.includes('ticket.form.php')) {
        return;
    }
    
    // Interceptar submit do formulário
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('form[name="asset_form"]');
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            // Verificar se há alerta pendente via AJAX ou data attribute
            const alertData = document.getElementById('blockitems-alert-data');
            
            if (alertData && alertData.dataset.showAlert === 'true') {
                e.preventDefault();
                
                // Exibir modal de confirmação
                showBlockItemsAlert(alertData.dataset.message, function(confirmed) {
                    if (confirmed) {
                        // Remover flag e submeter
                        alertData.dataset.showAlert = 'false';
                        form.submit();
                    }
                });
            }
        });
    });
    
    /**
     * Exibe modal de alerta
     */
    function showBlockItemsAlert(message, callback) {
        // Usar modal do GLPI se disponível, senão confirm nativo
        if (typeof glpi_confirm === 'function') {
            glpi_confirm({
                title: 'Atenção',
                message: message + '\n\nDeseja continuar mesmo assim?',
                confirm_callback: function() { callback(true); },
                cancel_callback: function() { callback(false); }
            });
        } else {
            const confirmed = confirm(
                '⚠️ ATENÇÃO\n\n' + 
                message + '\n\n' +
                'Deseja continuar mesmo assim?'
            );
            callback(confirmed);
        }
    }
})();
