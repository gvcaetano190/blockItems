/**
 * BlockItems - JavaScript para verificar Computer vinculado antes de solucionar/fechar
 */
(function() {
    'use strict';

    // Debug opcional: no console do navegador rode
    //   localStorage.setItem('blockitemsDebug', '1')
    // e recarregue. Para desligar:
    //   localStorage.removeItem('blockitemsDebug')
    const DEBUG = (function() {
        try {
            return window.localStorage && window.localStorage.getItem('blockitemsDebug') === '1';
        } catch (e) {
            return false;
        }
    })();

    function dlog() {
        if (DEBUG && typeof console !== 'undefined' && typeof console.log === 'function') {
            console.log.apply(console, arguments);
        }
    }

    function dwarn() {
        if (DEBUG && typeof console !== 'undefined' && typeof console.warn === 'function') {
            console.warn.apply(console, arguments);
        }
    }

    function derr() {
        if (typeof console !== 'undefined' && typeof console.error === 'function') {
            console.error.apply(console, arguments);
        }
    }
    
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
            const url = CFG_GLPI.root_doc + '/plugins/blockitems/ajax/check_computer.php?ticket_id=' + ticketId;

            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            const data = await response.json();
            return data.has_computer;
        } catch (error) {
            derr('BlockItems: Erro ao verificar computer', error);
            return true;
        }
    }
    
    // Exibir modal de confirmação
    function showConfirmModal(message) {
        return new Promise((resolve) => {
            if (typeof glpi_html_dialog === 'function') {
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
                const confirmed = confirm('⚠️ ATENÇÃO\n\n' + message.replace(/<[^>]*>/g, '') + '\n\nDeseja continuar mesmo assim?');
                resolve(confirmed);
            }
        });
    }
    
    // Inicialização
    document.addEventListener('DOMContentLoaded', function() {
        const ticketId = getTicketId();
        if (!ticketId) return;
        
        // Aguardar GLPI renderizar elementos
        setTimeout(function() {
            initBlockItems(ticketId);
        }, 1500);
    });
    
    function initBlockItems(ticketId) {
        // O GLPI 10 usa form com id="itil-form" (não asset_form)
        var form = document.getElementById('itil-form');
        if (!form) {
            form = document.querySelector('form[name="asset_form"]');
        }

        if (DEBUG) {
            try {
                dlog('BlockItems: URL atual:', window.location.href);
                dlog('BlockItems: Ticket ID:', ticketId);
                dlog('BlockItems: Formulário encontrado?', form !== null);
            } catch (e) {
                // noop
            }
        }
        
        if (form) {
            // Interceptar cliques nos botões de submit
            interceptButtonClicks(form, ticketId);
            dlog('BlockItems: Plugin inicializado para ticket #' + ticketId);
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
            dlog('BlockItems: Candidatos de salvar (total):', candidates.length);
            candidates.forEach(function(el, idx) {
                dlog('BlockItems: Candidato #' + idx + ' tag=' + el.tagName + ' name=' + (el.name || '') + ' type=' + (el.type || '') + ' text=' + (el.textContent || '').trim().substring(0, 30));
            });
        } catch (err) {
            dwarn('BlockItems: Falha ao listar candidatos:', err);
        }

        if (delegatedClickInstalled) {
            dlog('BlockItems: Delegação de clique já instalada, pulando...');
            return;
        }
        delegatedClickInstalled = true;
        dlog('BlockItems: Instalando delegação de clique (capture) para salvar/update...');

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
                dlog('BlockItems: Clique em update/add, mas não é do form esperado. name=' + controlName);
                return;
            }

            dlog('BlockItems: ====== CLIQUE EM SALVAR (delegado) ======');
            dlog('BlockItems: Control tag=' + control.tagName + ' name=' + controlName + ' type=' + (control.type || control.getAttribute('type') || ''));

            // Se já verificamos, permitir
            if (blockitemsChecked) {
                dlog('BlockItems: Já verificado, permitindo');
                blockitemsChecked = false; // reset
                return;
            }

            // Pegar status atual
            var statusEl = form.querySelector('select[name="status"]') || document.querySelector('select[name="status"]');
            var currentStatus = statusEl ? statusEl.value : null;
            dlog('BlockItems: Status atual:', currentStatus);

            // Se não é solucionado/fechado, permitir
            if (currentStatus !== STATUS_SOLVED && currentStatus !== STATUS_CLOSED) {
                dlog('BlockItems: Status não é 5 ou 6, permitindo');
                return;
            }

            // Bloquear ação e verificar
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            dlog('BlockItems: Verificando computador...');
            var hasComputer = await checkHasComputer(ticketId);
            dlog('BlockItems: Tem computador?', hasComputer);

            if (hasComputer) {
                dlog('BlockItems: Tem computador, permitindo submit no próximo clique');
                blockitemsChecked = true;
                setTimeout(function() {
                    control.click();
                }, 0);
                return;
            }

            dlog('BlockItems: SEM computador, exibindo alerta...');
            var confirmed = await showConfirmModal('Este chamado não possui <strong>Computador</strong> vinculado.<br><br>Deseja continuar?');

            if (confirmed) {
                dlog('BlockItems: Confirmado pelo usuário, permitindo submit no próximo clique');
                blockitemsChecked = true;
                setTimeout(function() {
                    control.click();
                }, 0);
            } else {
                dlog('BlockItems: Cancelado pelo usuário');
            }
        }, true); // capture phase

        // Backup: log de submit
        form.addEventListener('submit', function() {
            dlog('BlockItems: Submit event disparado');
        }, true);
    }
    
})();
