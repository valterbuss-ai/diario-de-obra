# Deploy de teste (link para o cliente)

Este guia sobe o sistema inteiro (frontend + backend + banco) no [Render](https://render.com),
gerando uma URL pública que o cliente pode abrir no navegador. O plano gratuito do Render
é suficiente para um teste/demo.

**Aviso sobre fotos**: no plano gratuito, o disco do backend é temporário — fotos
enviadas pelo operador podem ser apagadas quando o serviço reiniciar. Para um teste
rápido não é um problema; se precisar de persistência real, depois dá pra adicionar um
"Persistent Disk" pago no Render ou trocar o storage de fotos para algo como S3/Cloudinary.

## 1. Subir o código pro GitHub (você faz, uma vez)

No terminal, dentro da pasta do projeto (`diario-de-obra`), rode:

```
git remote add origin https://github.com/SEU_USUARIO/diario-de-obra.git
git branch -M main
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu usuário do GitHub. Se o repositório `diario-de-obra` ainda
não existe lá, crie um novo (vazio, sem README/gitignore) em https://github.com/new antes
de rodar o `git push` — marque como **privado**, já que é um projeto comercial.

O Git vai pedir login na primeira vez (abre o navegador automaticamente, ou pede usuário/
token). Depois disso o repositório fica salvo pra sempre — próximas atualizações são só
`git add`, `git commit`, `git push` de novo.

## 2. Criar conta no Render e importar o Blueprint

1. Crie uma conta em https://render.com (dá pra entrar direto com sua conta do GitHub).
2. No painel, clique em **New +** → **Blueprint**.
3. Selecione o repositório `diario-de-obra` que você acabou de subir.
4. O Render vai ler o arquivo `render.yaml` da raiz do projeto e mostrar 3 recursos prontos
   para criar: o banco (`diario-de-obra-db`), o backend (`diario-de-obra-backend`) e o
   frontend (`diario-de-obra-frontend`).
5. Antes de confirmar, o Render vai pedir pra preencher alguns valores "secretos"
   (marcados como `sync: false` no arquivo) — copie exatamente os mesmos valores que
   estão hoje no seu `backend/.env` local:
   - `MS_GRAPH_TENANT_ID`
   - `MS_GRAPH_CLIENT_ID`
   - `MS_GRAPH_CLIENT_SECRET`
   - `MS_GRAPH_USER_UPN`
   - `MS_GRAPH_SHARE_URL`
   - `N8N_WEBHOOK_URL`
6. Clique em **Apply** / **Create**. O Render cria o banco, depois builda e sobe o
   backend, depois builda e sobe o frontend. A primeira vez leva uns 5-10 minutos.

## 3. Popular o banco com os dados de teste (você faz, uma vez)

Depois que o backend estiver com status "Live" no painel do Render, abra o **Shell** do
serviço `diario-de-obra-backend` (aba "Shell" no painel dele) e rode:

```
npm run prisma:seed
```

Isso cria os logins de teste (admin, operador, engenheiro) e os cadastros de exemplo
(placas, contratos, serviços etc.) — os mesmos que você já usa no localhost.

## 4. Link pra mandar pro cliente

A URL do frontend aparece no painel do serviço `diario-de-obra-frontend`, algo como:

```
https://diario-de-obra-frontend.onrender.com
```

Esse é o link de teste. Logins de exemplo pra passar pro cliente (ou criar os reais
depois pela área de admin):
- Operador: `operador@obra.com` / `op123`
- Engenheiro: `engenheiro@obra.com` / `eng123`
- Admin: `admin@obra.com` / `admin123`

**Nota sobre o plano gratuito**: o backend "dorme" depois de ~15 min sem uso e demora
uns 30-50 segundos pra acordar no primeiro acesso seguinte — é normal, avise o cliente
que a primeira tela pode demorar um pouco.

## Atualizações futuras

Sempre que você (ou eu) fizer mudanças no código: `git add`, `git commit`, `git push`.
O Render redeploya sozinho a cada push na branch `main` — não precisa repetir os passos
acima, só o push.
