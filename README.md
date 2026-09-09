# Diário de Obra

Sistema web para uma usina de asfalto que presta serviço a órgãos públicos (DER, DNIT, prefeituras). Consolida automaticamente os registros de campo feitos pelos operadores na "planilha" do engenheiro, eliminando lançamento manual.

## Módulos

1. **App do operador** (`/operador/*`) — fluxo mobile-first em 3 telas (equipe → carga → local/fotos) para registrar cada serviço executado.
2. **Painel administrativo** (`/admin/*`) — CRUD dos 7 cadastros mestres (motoristas, placas, contratos, serviços, usinas, rodovias, climas), acessível ao perfil **gestor**.
3. **Visão do engenheiro** (`/engenheiro`) — planilha consolidada de todos os registros enviados, com exportação para `.xlsx`.

## Stack

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, JWT, multer (upload local em `backend/uploads`).
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4, React Router, axios, lucide-react, SheetJS (`xlsx`, build oficial via CDN — veja nota de segurança abaixo).

## Estrutura

```
diario-de-obra/
├── backend/
│   ├── src/
│   │   ├── routes/         (endpoints REST agrupados por recurso)
│   │   ├── controllers/    (regra de negócio + acesso ao Prisma)
│   │   ├── middleware/     (JWT auth, upload multer)
│   │   └── server.ts
│   └── prisma/
│       ├── schema.prisma   (10 tabelas)
│       └── seed.ts         (dados de teste)
├── frontend/
│   └── src/
│       ├── pages/operador/    (Tela1, Tela2, Tela3, Confirmação)
│       ├── pages/admin/       (Dashboard + 7 CRUDs)
│       ├── pages/engenheiro/  (Planilha)
│       ├── components/        (layouts, CrudPage genérico, campos de formulário)
│       ├── contexts/          (AuthContext, RegistroContext)
│       └── services/          (api.ts, hooks.ts)
└── docker-compose.yml      (PostgreSQL local para desenvolvimento)
```

## Pré-requisitos

- Node.js 18+ (testado com Node 22)
- PostgreSQL 14+ — via Docker (`docker-compose.yml` incluso) ou instalação local

## Setup

### 1. Banco de dados

Com Docker:

```bash
docker compose up -d
```

Isso sobe um PostgreSQL em `localhost:5432` com usuário/senha `postgres`/`postgres` e banco `diario_de_obra` (já configurado em `backend/.env.example`).

Sem Docker, crie manualmente um banco `diario_de_obra` no seu PostgreSQL local e ajuste `DATABASE_URL` em `backend/.env`.

### 2. Backend

```bash
cd backend
copy .env.example .env      # Windows (ou: cp .env.example .env)
npm install
npm run prisma:generate
npm run prisma:migrate      # cria as tabelas
npm run prisma:seed         # popula com os dados de teste
npm run dev                 # http://localhost:3333
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

O frontend já está configurado (`frontend/.env`) para chamar a API em `http://localhost:3333`.

## Login de teste (criados pelo seed)

| Perfil | Email | Senha | Acesso |
|---|---|---|---|
| Gestor | admin@obra.com | admin123 | Painel administrativo |
| Operador | operador@obra.com | op123 | App de campo |
| Engenheiro | engenheiro@obra.com | eng123 | Planilha consolidada |

## Regras de negócio implementadas

- Dropdowns do app do operador mostram apenas itens com status ativo/ativa.
- O campo **Motorista** da Tela 1 é um campo de texto livre com sugestões (`datalist`) dos motoristas ativos; ao enviar, o backend localiza o motorista pelo nome (ou cria um novo cadastro automaticamente, mantendo a integridade referencial da tabela `registros`).
- O campo **Cidade** da Tela 3 é sempre automático: ao selecionar a rodovia e digitar o Km, o frontend consulta `GET /api/rodovias/lookup?rodovia=...&km=...`, que busca no cadastro de rodovias o trecho cujo intervalo `km_inicio`–`km_fim` contém o Km informado. Se não encontrar, exibe "Trecho não localizado" e bloqueia o envio.
- As 4 fotos do serviço (antes, durante, depois, trena) são obrigatórias para finalizar um registro com status "enviado" — validado tanto no frontend (botão desabilitado) quanto no backend.
- A foto do ticket é capturada separadamente na Tela 2 e é opcional.
- Cada perfil só acessa o seu módulo (roteamento protegido por `ProtectedRoute` no frontend e por `requireRole` no backend).

## Exportar para Excel

Na Visão do engenheiro (`/engenheiro`), o botão "Exportar para Excel" gera um `.xlsx` com todas as colunas da tabela usando SheetJS, no navegador (sem passar pelo backend).

## Nota de segurança sobre dependências

- `xlsx` (SheetJS) é instalado a partir da build oficial `https://cdn.sheetjs.com/...` porque a versão publicada no registro npm (0.18.5) tem vulnerabilidades conhecidas sem correção no npm; essa é a distribuição recomendada pelos mantenedores.
- `react-router-dom` está fixado na versão mais recente disponível; resta um advisory de alta severidade (`GHSA-qwww-vcr4-c8h2`) relativo a um bypass de CSRF no **modo RSC/Server Actions** do React Router — este projeto é uma SPA cliente pura (`BrowserRouter`, sem RSC/Server Actions), então a vulnerabilidade não é explorável aqui. Vale revisar ao atualizar a dependência no futuro.

## Uploads

As imagens enviadas pelo app do operador são salvas em `backend/uploads` e servidas estaticamente em `http://localhost:3333/uploads/<arquivo>`. Essa pasta é ignorada pelo git (exceto `.gitkeep`).
