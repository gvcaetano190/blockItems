/**
 * BlockItems - JavaScript para verificar Computer vinculado antes de solucionar/fechar
 */
(function() {
    'use strict';
    
    // Verificar se estamos na página de ticket
    if (!window.location.href.includes('ticket.form.php')) {
        return;
    }
    
    // Extrair ID do ticket da URL
    function getTicketId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }
    
    // Status do GLPI
    const STATUS_SOLVED = '5';
    const STATUS_CLOSED = '6';
    
    // Verificar se há Computer vinculado via AJAX
    async function checkHasComputer(ticketId) {
        try {
            const response = await fetch(
                CFG_GLPI.root_doc + '/plugins/blockitems/ajax/check_computer.php?ticket_id=' + ticketId,
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );
            const data = await response.json();
            return data.has_computer;
        } catch (error) {
            console.error('BlockItems: Erro ao verificar computer', error);
            return true; // Em caso de erro, permite continuar
        }
    }
    
    // Exibir modal de confirmação usando GLPI dialog
    function showConfirmModal(message) {
        return new Promise((resolve) => {
            // Usar glpi_html_dialog do GLPI 10
            if (typeof glpi_html_dialog === 'function') {
                glpi_html_dialog({
                    title: '⚠️ Computador não vinculado',
                    body: '<div class="alert alert-warning">' +
                          '<i class="fas fa-exclamation-triangle fa-2x mb-2"></i>' +
                          '<p class="mb-0">' + message + '</p>' +
                          '</div>',
                    dialogclass: 'modal-md',
                    buttons: [
                        {
                            label: 'Cancelar',
                            class: 'btn-outline-secondary',
                            click: function(e) {
                                $(this).closest('.modal').modal('hide');
                                resolve(false);
                            }
                        },
                        {
                            label: 'Continuar mesmo assim',
                            class: 'btn-warning',
                            click: function(e) {
                                $(this).closest('.modal').modal('hide');
                                resolve(true);
                            }
                        }
                    ]
                });
            } else if (typeof $ !== 'undefined' && typeof $.fn.dialog !== 'undefined') {
                // jQuery UI Dialog fallback
                const $dialog = $('<div>')
                    .html('<p style="font-size:14px;"><strong>⚠️ ATENÇÃO</strong></p><p>' + message + '</p>')
                    .dialog({
                        modal: true,
                        title: 'Computador não vinculado',
                        width: 450,
                        buttons: {
                            'Continuar mesmo assim': function() {
                                $(this).dialog('close');
                                resolve(true);
                            },
                            'Cancelar': function() {
                                $(this).dialog('close');
                                resolve(false);
                            }
                        },
                        close: function() {
                            $(this).remove();
                        }
                    });
            } else {
                // Fallback: confirm nativo
                const confirmed = confirm(
                    '⚠️ ATENÇÃO\n\n' + 
                    message.replace(/<[^>]*>/g, '') + '\n\n' +
                    'Deseja continuar mesmo assim?'
                );
                resolve(confirmed);
            }
        });
    }
    
    // Interceptar mudança de status
    document.addEventListener('DOMContentLoaded', function() {
        const ticketId = getTicketId();
        if (!ticketId) return;
        
        // Encontrar o select de status
        const statusSelect = document.querySelector('select[name="status"]');
        if (!statusSelect) return;
        
        // Armazenar status original
        let originalStatus = statusSelect.value;
        let isProcessing = false;
        
        // Interceptar mudança de status
        statusSelect.addEventListener('change', async function(e) {
            const newStatus = this.value;
            
            // Verificar se está mudando para Solucionado ou Fechado
            if (newStatus !== STATUS_SOLVED && newStatus !== STATUS_CLOSED) {
                originalStatus = newStatus;
                return;
            }
            
            if (isProcessing) return;
            isProcessing = true;
            
            // Verificar se tem Computer
            const hasComputer = await checkHasComputer(ticketId);
            
            if (!hasComputer) {
                const confirmed = await showConfirmModal(
                    'Este chamado não possui <strong>Computador</strong> vinculado.<br><br>' +
                    'Deseja continuar com a solução/fechamento mesmo assim?'
                );
                
                if (!confirmed) {
                    // Reverter para status anterior
                    this.value = originalStatus;
                    // Disparar evento change para atualizar interface do Select2
                    $(this).trigger('change.select2');
                } else {
                    originalStatus = newStatus;
                }
            } else {
                originalStatus = newStatus;
            }
            
            isProcessing = false;
        });
        
        // Também interceptar o submit do formulário como backup
        const form = document.querySelector('form[name="asset_form"]');
        if (form) {
            form.addEventListener('submit', async function(e) {
                const currentStatus = statusSelect ? statusSelect.value : null;
                
                if (currentStatus !== STATUS_SOLVED && currentStatus !== STATUS_CLOSED) {
                    return true;
                }
                
                // Verificar se já foi confirmado
                if (form.querySelector('input[name="blockitems_confirmed"]')) {
                    return true;
                }
                
                // Verificar se tem Computer
                const hasComputer = await checkHasComputer(ticketId);
                
                if (!hasComputer) {
                    e.preventDefault();
                    
                    const confirmed = await showConfirmModal(
                        'Este chamado não possui <strong>Computador</strong> vinculado.<br><br>' +
                        'Deseja continuar com a solução/fechamento mesmo assim?'
                    );
                    
                    if (confirmed) {
                        // Submeter formulário novamente
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = 'blockitems_confirmed';
                        input.value = '1';
                        form.appendChild(input);
                        form.submit();
                    }
                }
            });
        }
        
        console.log('BlockItems: Plugin carregado para ticket #' + ticketId);
    });
})();
