# 📦 Guia de Instalação - BlockItems

## 🎯 Requisitos

Antes de instalar, certifique-se de que seu ambiente atende aos requisitos:

- ✅ GLPI versão 10.0.0 ou superior
- ✅ PHP versão 8.0 ou superior
- ✅ Permissões de escrita na pasta `plugins/`

---

## 🚀 Instalação

### Método 1: Download Manual

1. **Baixe o plugin**
   ```bash
   cd /tmp
   wget https://github.com/gvcaetano190/blockItems/archive/refs/heads/main.tar.gz
   ```

2. **Extraia para a pasta de plugins do GLPI**
   ```bash
   cd /var/www/html/glpi/plugins
   sudo tar -xzf /tmp/main.tar.gz
   sudo mv blockItems-main blockitems
   ```

3. **Ajuste permissões**
   ```bash
   sudo chown -R www-data:www-data blockitems
   sudo chmod -R 755 blockitems
   ```

4. **Instale via interface GLPI**
   - Acesse: **Configurar → Plugins**
   - Localize "Block Items Alert"
   - Clique em **Instalar**
   - Clique em **Ativar**

---

### Método 2: Git Clone

1. **Clone o repositório**
   ```bash
   cd /var/www/html/glpi/plugins
   sudo git clone https://github.com/gvcaetano190/blockItems.git blockitems
   ```

2. **Ajuste permissões**
   ```bash
   sudo chown -R www-data:www-data blockitems
   sudo chmod -R 755 blockitems
   ```

3. **Instale via interface GLPI**
   - Acesse: **Configurar → Plugins**
   - Localize "Block Items Alert"
   - Clique em **Instalar**
   - Clique em **Ativar**

---

### Método 3: Upload via Interface

1. **Baixe o arquivo ZIP**
   - Acesse https://github.com/gvcaetano190/blockItems
   - Clique em "Code" → "Download ZIP"

2. **Upload via GLPI**
   - Acesse: **Configurar → Plugins**
   - Clique em **Upload Plugin**
   - Selecione o arquivo ZIP baixado
   - Clique em **Instalar**
   - Clique em **Ativar**

---

## ⚙️ Configuração Inicial

Após a instalação:

1. **Acesse as configurações**
   - Vá em **Configurar → Plugins**
   - Clique em **BlockItems**

2. **Configure as opções**
   - ✅ **Habilitar Alerta**: Marca para ativar os alertas
   - ✅ **Habilitar Logs**: Marca para registrar logs

3. **Clique em Salvar**

---

## 🗄️ Banco de Dados

Durante a instalação, o plugin cria automaticamente a tabela:

```sql
CREATE TABLE `glpi_plugin_blockitems_config` (
    `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `enable_alert` tinyint(1) DEFAULT 1,
    `enable_logs` tinyint(1) DEFAULT 1,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## ✅ Verificação

Para verificar se o plugin foi instalado corretamente:

1. **Verifique a lista de plugins**
   ```bash
   ls -la /var/www/html/glpi/plugins/blockitems
   ```

2. **Verifique a tabela no banco**
   ```bash
   mysql -u root -p glpi -e "SHOW TABLES LIKE 'glpi_plugin_blockitems_config';"
   ```

3. **Teste o alerta**
   - Crie um chamado sem computador vinculado
   - Tente mudar o status para "Solucionado"
   - O alerta deve aparecer

---

## 🔄 Atualização

Para atualizar o plugin:

```bash
cd /var/www/html/glpi/plugins
sudo rm -rf blockitems
sudo git clone https://github.com/gvcaetano190/blockItems.git blockitems
sudo chown -R www-data:www-data blockitems
```

Depois, no GLPI:
1. Desative o plugin
2. Ative novamente

---

## 🗑️ Desinstalação

Para remover completamente o plugin:

1. **Via interface GLPI**
   - Acesse: **Configurar → Plugins**
   - Clique em **Desativar**
   - Clique em **Desinstalar** (remove a tabela do banco)

2. **Remover arquivos**
   ```bash
   sudo rm -rf /var/www/html/glpi/plugins/blockitems
   ```

---

## 🐛 Problemas Comuns

### Plugin não aparece na lista

- Verifique permissões da pasta: `sudo chown -R www-data:www-data blockitems`
- Verifique nome da pasta: deve ser `blockitems` (minúsculo)

### Erro ao instalar

- Verifique versão do GLPI: `grep GLPI_VERSION /var/www/html/glpi/version.php`
- Verifique versão do PHP: `php -v`
- Verifique logs: `/var/www/html/glpi/files/_log/`

### Alerta não funciona

- Limpe cache do navegador (Ctrl + F5)
- Verifique se "Habilitar Alerta" está marcado
- Verifique console do navegador (F12)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs em `/var/www/html/glpi/files/_log/`
2. Abra uma issue no GitHub: https://github.com/gvcaetano190/blockItems/issues
3. Inclua:
   - Versão do GLPI
   - Versão do PHP
   - Mensagem de erro completa
   - Logs relevantes
