# 🔔 BlockItems - GLPI Plugin

Plugin para GLPI que exibe um alerta quando um chamado é solucionado ou fechado sem ter um computador vinculado.

## 📋 Descrição

O **BlockItems** monitora a mudança de status dos chamados e verifica se há um computador vinculado. Quando o usuário tenta solucionar (status 5) ou fechar (status 6) um chamado sem computador vinculado, um alerta visual é exibido.

**⚠️ Importante**: O alerta **não bloqueia** a ação, permitindo que o usuário continue caso seja necessário (ex: chamados de solicitação de acesso que não precisam de máquina).

## ✨ Funcionalidades

- ✅ Detecta mudança de status para Solucionado (5) ou Fechado (6)
- ✅ Verifica se há Computer vinculado em `glpi_items_tickets`
- ✅ Exibe alerta visual (não bloqueante)
- ✅ Permite continuar ou cancelar a ação
- ✅ Configuração para habilitar/desabilitar alerta
- ✅ Registro de logs opcional
- ✅ Compatível com GLPI 10.0.0+

## 📦 Requisitos

- GLPI >= 10.0.0
- PHP >= 8.0

## 🚀 Instalação

### Método 1: Manual

1. Baixe o plugin
2. Extraia para `/var/www/html/glpi/plugins/blockitems`
3. Acesse GLPI → Configurar → Plugins
4. Clique em "Instalar" e depois "Ativar"

### Método 2: Via linha de comando

```bash
cd /var/www/html/glpi/plugins
sudo git clone https://github.com/gvcaetano190/blockItems.git blockitems
sudo chown -R www-data:www-data blockitems
```

Depois instale via interface do GLPI.

## ⚙️ Configuração

1. Acesse **Configurar → Plugins → BlockItems**
2. Configure as opções:
   - **Habilitar Alerta**: Exibe o alerta visual
   - **Habilitar Logs**: Registra alertas em `/files/_log/blockitems.log`

## 🔍 Como Funciona

```
Usuário soluciona/fecha ticket
           ↓
Há Computer vinculado?
           ↓
    ┌──────┴──────┐
   SIM           NÃO
    ↓             ↓
 Continua    ALERTA exibido
             "Este chamado não possui
              computador vinculado"
                    ↓
           [Continuar] [Cancelar]
```

## 📝 Estrutura

```
blockitems/
├── setup.php              # Inicialização e hooks
├── hook.php               # Lógica principal
├── front/
│   └── config.form.php    # Página de configuração
├── js/
│   └── blockitems.js      # JavaScript para alerta
├── inc/
│   └── Config.class.php   # Classe de configuração
├── locales/
│   ├── en_GB.po           # Traduções inglês
│   └── pt_BR.po           # Traduções português
├── README.md
├── CHANGELOG.md
└── LICENSE
```

## 🗄️ Banco de Dados

O plugin cria a tabela `glpi_plugin_blockitems_config`:

```sql
CREATE TABLE glpi_plugin_blockitems_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enable_alert TINYINT(1) DEFAULT 1,
    enable_logs TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🐛 Solução de Problemas

### Alerta não aparece

1. Verifique se o plugin está ativado
2. Verifique se "Habilitar Alerta" está marcado nas configurações
3. Limpe o cache do navegador
4. Verifique o console do navegador (F12) por erros JavaScript

### Logs não são gerados

1. Verifique se "Habilitar Logs" está marcado
2. Verifique permissões da pasta `/files/_log/`
3. Verifique se o arquivo `blockitems.log` pode ser criado

## 📄 Licença

GPLv2+

## 👤 Autor

**Gabriel Caetano**
- GitHub: [@gvcaetano190](https://github.com/gvcaetano190)

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📝 Changelog

Veja [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

## 🔗 Links

- [Documentação GLPI](https://glpi-project.org/)
- [GLPI Developer Documentation](https://glpi-developer-documentation.readthedocs.io/)
