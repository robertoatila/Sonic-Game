---
name: codex-antigravity-skill-policy
description: Use para orientar Codex, Antigravity, Claude Code e agentes quando houver muitas skills. Sempre rotear automaticamente por categoria em vez de carregar apenas uma skill generica. Nao exige comandos com cifrao. Funciona para qualquer projeto.
---

# Codex / Antigravity Skill Policy

Nao leia todas as skills.
Nao exija comandos com cifrao.
Leia primeiro project-auto-router e depois o router especifico.

Mapa universal:
- layout, UI, CSS, HTML, redesign, tela, dashboard, responsividade -> project-layout-router
- seguranca, auth, JWT, sessao, cookie, RBAC, XSS, SQLi, CSRF, IDOR, CORS -> project-security-router
- backend, API, controller, service, repository, endpoint, regra de negocio -> project-backend-router
- database, banco, SQL, schema, migration, query, ORM, seed -> project-database-router
- deploy, Docker, Railway, Vercel, AWS, CI/CD, logs, healthcheck, env -> project-deploy-router
- bug, review, refatoracao, diff, patch, PR, pre-push, qualidade -> project-review-router
