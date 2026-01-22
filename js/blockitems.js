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
        
        // O GLPI 10 usa form com id="itil-form" (não asset_form)
        var form = document.getElementById('itil-form');
        if (!form) {
            form = document.querySelector('form[name="asset_form"]');
        }
        console.log('BlockItems: Formulário encontrado?', form !== null);
        
        if (form) {
            // Interceptar cliques nos botões de submit
            interceptButtonClicks(form, ticketId);
            console.log('BlockItems: Plugin inicializado para ticket #' + ticketId);
        }
    }
    
    // Flag para controlar se já verificamos
    var blockitemsChecked = false;
    
    function interceptButtonClicks(form, ticketId) {
        // No GLPI 10, os botões podem estar FORA do form mas referenciam via form="itil-form"
        // Procurar botões dentro do form E botões que referenciam o form
        var formId = form.id || 'itil-form';
        
        // Botões dentro do form
        var buttonsInForm = form.querySelectorAll('button[type="submit"], input[type="submit"], button[name="update"], button[name="add"]');
        
        // Botões fora do form que referenciam via form="itil-form"
        var buttonsOutsideForm = document.querySelectorAll('button[form="' + formId + '"], input[form="' + formId + '"]');
        
        // Combinar todos os botões únicos
        var allButtons = new Set();
        buttonsInForm.forEach(function(btn) { allButtons.add(btn); });
        buttonsOutsideForm.forEach(function(btn) { allButtons.add(btn); });
        
        var buttons = Array.from(allButtons);
        console.log('BlockItems: Botões encontrados (total):', buttons.length);
        
        buttons.forEach(function(btn, index) {
            console.log('BlockItems: Botão #' + index + ' - name=' + btn.name + ' type=' + btn.type + ' text=' + (btn.textContent || '').trim().substring(0, 30));
            
            // Só interceptar botões de update/save (não delete, restore, etc)
            if (btn.name === 'delete' || btn.name === 'purge' || btn.name === 'restore') {
                console.log('BlockItems: Ignorando botão de delete/purge/restore');
                return;
            }
            
            btn.addEventListener('click', async function(e) {
                console.log('BlockItems: ====== CLIQUE NO BOTÃO ======');
                console.log('BlockItems: Botão clicado:', btn.name || btn.textContent.trim());
                
                // Se já verificamos, permitir
                if (blockitemsChecked) {
                    console.log('BlockItems: Já verificado, permitindo');
                    blockitemsChecked = false; // Reset para próxima vez
                    return true;
                }
                
                // Pegar status atual
                var statusEl = form.querySelector('[name="status"]');
                if (!statusEl) {
                    statusEl = document.querySelector('[name="status"]');
                }
                var currentStatus = statusEl ? statusEl.value : null;
                console.log('BlockItems: Status atual:', currentStatus);
                
                // Se não é solucionado/fechado, permitir
                if (currentStatus !== STATUS_SOLVED && currentStatus !== STATUS_CLOSED) {
                    console.log('BlockItems: Status não é 5 ou 6, permitindo');
                    return true;
                }
                
                // Bloquear ação e verificar
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                console.log('BlockItems: Verificando computador...');
                var hasComputer = await checkHasComputer(ticketId);
                console.log('BlockItems: Tem computador?', hasComputer);
                
                if (hasComputer) {
                    console.log('BlockItems: Tem computador, clicando botão novamente...');
                    blockitemsChecked = true;
                    btn.click();
                    return;
                }
                
                // Não tem computador - mostrar alerta
                console.log('BlockItems: SEM computador, exibindo alerta...');
                var confirmed = await showConfirmModal('Este chamado não possui <strong>Computador</strong> vinculado.<br><br>Deseja continuar?');
                
                if (confirmed) {
                    console.log('BlockItems: Confirmado pelo usuário, clicando botão...');
                    blockitemsChecked = true;
                    btn.click();
                } else {
                    console.log('BlockItems: Cancelado pelo usuário');
                }
            }, true); // capture phase
        });
        
        // Também monitorar o evento submit como backup
        form.addEventListener('submit', function(e) {
            console.log('BlockItems: Submit event disparado');
        });
    }
    
})();
