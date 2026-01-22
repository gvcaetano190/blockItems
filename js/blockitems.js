/**
 * BlockItems - JavaScript para verificar Computer vinculado antes de solucionar/fechar
 */
console.log('BlockItems: Script iniciado');

(function() {
    'use strict';
    
    console.log('BlockItems: Função IIFE executada');
    console.log('BlockItems: URL atual:', window.location.href);
    
    // Verificar se estamos na página de ticket
    if (!window.location.href.includes('ticket.form.php')) {
        console.log('BlockItems: Não estamos na página de ticket, saindo...');
        return;
    }
    
    console.log('BlockItems: Estamos na página de ticket!');
    
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
        console.log('BlockItems: Verificando computer para ticket #' + ticketId);
        try {
            const url = CFG_GLPI.root_doc + '/plugins/blockitems/ajax/check_computer.php?ticket_id=' + ticketId;
            console.log('BlockItems: URL AJAX:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            console.log('BlockItems: Resposta AJAX:', data);
            return data.has_computer;
        } catch (error) {
            console.error('BlockItems: Erro ao verificar computer', error);
            return true;
        }
    }
    
    // Exibir modal de confirmação
    function showConfirmModal(message) {
        console.log('BlockItems: Exibindo modal de confirmação');
        console.log('BlockItems: glpi_html_dialog disponível?', typeof glpi_html_dialog === 'function');
        
        return new Promise((resolve) => {
            if (typeof glpi_html_dialog === 'function') {
                console.log('BlockItems: Usando glpi_html_dialog');
                glpi_html_dialog({
                    title: '⚠️ Computador não vinculado',
                    body: '<div class="alert alert-warning"><p class="mb-0">' + message + '</p></div>',
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
            } else {
                console.log('BlockItems: Usando confirm nativo');
                const confirmed = confirm('⚠️ ATENÇÃO\n\n' + message.replace(/<[^>]*>/g, '') + '\n\nDeseja continuar mesmo assim?');
                resolve(confirmed);
            }
        });
    }
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', function() {
        console.log('BlockItems: DOMContentLoaded disparado');
        
        const ticketId = getTicketId();
        console.log('BlockItems: Ticket ID:', ticketId);
        if (!ticketId) return;
        
        // Aguardar GLPI renderizar elementos
        setTimeout(function() {
            initBlockItems(ticketId);
        }, 1500);
    });
    
    function initBlockItems(ticketId) {
        console.log('BlockItems: Iniciando após timeout...');
        
        // Debug: listar todos os selects
        const allSelects = document.querySelectorAll('select');
        console.log('BlockItems: Total de selects:', allSelects.length);
        allSelects.forEach(function(sel, i) {
            console.log('BlockItems: Select #' + i + ' name=' + sel.name + ' id=' + sel.id);
        });
        
        // Interceptar submit do formulário
        const form = document.querySelector('form[name="asset_form"]');
        console.log('BlockItems: Formulário encontrado?', form !== null);
        
        if (form) {
            interceptFormSubmit(form, ticketId);
            console.log('BlockItems: Plugin inicializado para ticket #' + ticketId);
        }
    }
    
    function interceptFormSubmit(form, ticketId) {
        form.addEventListener('submit', async function(e) {
            console.log('BlockItems: ====== SUBMIT INTERCEPTADO ======');
            
            // Verificar se já confirmado
            if (form.querySelector('input[name="blockitems_confirmed"]')) {
                console.log('BlockItems: Já confirmado, permitindo');
                return true;
            }
            
            // Pegar status
            var currentStatus = null;
            var statusEl = form.querySelector('[name="status"]');
            if (statusEl) {
                currentStatus = statusEl.value;
                console.log('BlockItems: Status encontrado:', currentStatus);
            }
            
            // Se não é solucionado/fechado, permitir
            if (currentStatus !== STATUS_SOLVED && currentStatus !== STATUS_CLOSED) {
                console.log('BlockItems: Status não é 5 ou 6, permitindo');
                return true;
            }
            
            console.log('BlockItems: Verificando computador...');
            e.preventDefault();
            e.stopPropagation();
            
            var hasComputer = await checkHasComputer(ticketId);
            console.log('BlockItems: Tem computador?', hasComputer);
            
            if (hasComputer) {
                console.log('BlockItems: Tem computador, submetendo...');
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'blockitems_confirmed';
                input.value = '1';
                form.appendChild(input);
                form.submit();
                return;
            }
            
            console.log('BlockItems: SEM computador, exibindo alerta...');
            var confirmed = await showConfirmModal('Este chamado não possui <strong>Computador</strong> vinculado.<br><br>Deseja continuar?');
            
            if (confirmed) {
                console.log('BlockItems: Confirmado pelo usuário');
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'blockitems_confirmed';
                input.value = '1';
                form.appendChild(input);
                form.submit();
            } else {
                console.log('BlockItems: Cancelado pelo usuário');
            }
        }, true);
    }
    
})();
