# Project Agent Rules

Use os routers em .agents/skills automaticamente.
Nao use comandos destrutivos.
Nao exponha secrets, tokens, cookies, senhas, chaves privadas ou URLs sensiveis.
Detecte a stack do projeto antes de alterar arquitetura.

## Routers universais
- Auto/politica: codex-antigravity-skill-policy + project-auto-router.
- UI/layout/design: project-layout-router.
- Seguranca: project-security-router.
- Backend/API: project-backend-router.
- Database/SQL/ORM: project-database-router.
- Deploy/CI/infra: project-deploy-router.
- Review/bug/refatoracao: project-review-router.

Quando uma tarefa cruzar nichos, combine routers. Exemplo:
- Endpoint inseguro: backend + security + review.
- Erro de banco em producao: database + deploy + review.
- Tela com dados mockados: layout + backend + review.
