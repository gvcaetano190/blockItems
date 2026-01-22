# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-01-22

### ✨ Adicionado
- Sistema de alerta visual ao solucionar/fechar chamado sem computador
- Verificação automática de Computer vinculado em `glpi_items_tickets`
- Página de configuração com opções:
  - Habilitar/desabilitar alerta
  - Habilitar/desabilitar logs
- Modal de confirmação (não bloqueante)
- Registro de logs em `/files/_log/blockitems.log`
- Suporte a traduções (pt_BR e en_GB)
- Compatibilidade com GLPI 10.0.0 a 10.9.99
- Conformidade com CSRF do GLPI
- Classe de configuração `PluginBlockitemsConfig`

### 🔧 Técnico
- Hook `pre_item_update` para interceptar mudanças de status
- JavaScript para modal de alerta
- Estrutura de banco de dados para configurações
- Validação de status (Solved=5, Closed=6)
- Query otimizada para verificação de itens vinculados

### 📝 Documentação
- README.md completo
- Comentários no código
- Guia de instalação
- Guia de solução de problemas

---

## Tipos de Mudanças

- `✨ Adicionado` para novas funcionalidades
- `🔧 Modificado` para mudanças em funcionalidades existentes
- `🐛 Corrigido` para correção de bugs
- `🗑️ Removido` para funcionalidades removidas
- `⚠️ Depreciado` para funcionalidades que serão removidas
- `🔒 Segurança` para correções de vulnerabilidades
