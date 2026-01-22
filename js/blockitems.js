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
    var delegatedClickInstalled = false;
    
    function interceptButtonClicks(form, ticketId) {
        // Estratégia GLPI 10: delegação no document (os botões podem ser renderizados/trocados via AJAX)
        // e podem estar fora do form com atributo form="itil-form".
        var formId = form.id || 'itil-form';

        // Logar candidatos com seletor mais estrito (evita pegar input hidden name=id)
        try {
            var candidates = document.querySelectorAll(
                'button[name="update"], button[name="add"], input[type="submit"][name="update"], input[type="submit"][name="add"], ' +
                'button[form="' + formId + '"][name="update"], button[form="' + formId + '"][name="add"], ' +
                'input[type="submit"][form="' + formId + '"][name="update"], input[type="submit"][form="' + formId + '"][name="add"]'
            );
            console.log('BlockItems: Candidatos de salvar (total):', candidates.length);
            candidates.forEach(function(el, idx) {
                console.log('BlockItems: Candidato #' + idx + ' tag=' + el.tagName + ' name=' + (el.name || '') + ' type=' + (el.type || '') + ' text=' + (el.textContent || '').trim().substring(0, 30));
            });
        } catch (err) {
            console.warn('BlockItems: Falha ao listar candidatos:', err);
        }

        if (delegatedClickInstalled) {
            console.log('BlockItems: Delegação de clique já instalada, pulando...');
            return;
        }
        delegatedClickInstalled = true;
        console.log('BlockItems: Instalando delegação de clique (capture) para salvar/update...');

        document.addEventListener('click', async function(e) {
            // Procurar o controle clicado (pode clicar no ícone dentro do botão)
            var control = null;
            if (e && e.target && typeof e.target.closest === 'function') {
                control = e.target.closest('button, input');
            }
            if (!control) return;

            var controlName = control.getAttribute('name') || control.name || '';
            if (controlName !== 'update' && controlName !== 'add') {
                return;
            }

            // Confirmar que o botão está associado ao form do ticket
            var associatedForm = control.form;
            if (!associatedForm) {
                var formAttr = control.getAttribute('form');
                if (formAttr) {
                    associatedForm = document.getElementById(formAttr);
                }
            }
            if (!associatedForm || associatedForm !== form) {
                console.log('BlockItems: Clique em update/add, mas não é do form esperado. name=' + controlName);
                return;
            }

            console.log('BlockItems: ====== CLIQUE EM SALVAR (delegado) ======');
            console.log('BlockItems: Control tag=' + control.tagName + ' name=' + controlName + ' type=' + (control.type || control.getAttribute('type') || ''));

            // Se já verificamos, permitir
            if (blockitemsChecked) {
                console.log('BlockItems: Já verificado, permitindo');
                blockitemsChecked = false; // reset
                return;
            }

            // Pegar status atual
            var statusEl = form.querySelector('select[name="status"]') || document.querySelector('select[name="status"]');
            var currentStatus = statusEl ? statusEl.value : null;
            console.log('BlockItems: Status atual:', currentStatus);

            // Se não é solucionado/fechado, permitir
            if (currentStatus !== STATUS_SOLVED && currentStatus !== STATUS_CLOSED) {
                console.log('BlockItems: Status não é 5 ou 6, permitindo');
                return;
            }

            // Bloquear ação e verificar
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            console.log('BlockItems: Verificando computador...');
            var hasComputer = await checkHasComputer(ticketId);
            console.log('BlockItems: Tem computador?', hasComputer);

            if (hasComputer) {
                console.log('BlockItems: Tem computador, permitindo submit no próximo clique');
                blockitemsChecked = true;
                setTimeout(function() {
                    control.click();
                }, 0);
                return;
            }

            console.log('BlockItems: SEM computador, exibindo alerta...');
            var confirmed = await showConfirmModal('Este chamado não possui <strong>Computador</strong> vinculado.<br><br>Deseja continuar?');

            if (confirmed) {
                console.log('BlockItems: Confirmado pelo usuário, permitindo submit no próximo clique');
                blockitemsChecked = true;
                setTimeout(function() {
                    control.click();
                }, 0);
            } else {
                console.log('BlockItems: Cancelado pelo usuário');
            }
        }, true); // capture phase

        // Backup: log de submit
        form.addEventListener('submit', function() {
            console.log('BlockItems: Submit event disparado');
        }, true);
    }
    
})();
