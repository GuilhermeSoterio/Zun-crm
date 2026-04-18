# Deploy no Railway

## Pré-requisitos
- Conta no [Railway](https://railway.app)
- Repositório no GitHub com o código

---

## Passo a passo

### 1. Criar o projeto no Railway
1. Acesse railway.app → **New Project** → **Deploy from GitHub repo**
2. Selecione este repositório

---

### 2. Adicionar PostgreSQL
No projeto Railway: **+ Add Service** → **Database** → **PostgreSQL**
- A variável `DATABASE_URL` será injetada automaticamente nos serviços

### 3. Adicionar Redis
No projeto Railway: **+ Add Service** → **Database** → **Redis**
- A variável `REDIS_URL` será injetada automaticamente

---

### 4. Serviço: API

1. **+ Add Service** → **GitHub Repo** → selecione o repo
2. Em **Settings → General**:
   - **Root Directory:** deixe vazio (usa a raiz do monorepo)
   - **Config File Path:** `apps/api/railway.toml`
3. Em **Settings → Variables**, adicione:

```
NODE_ENV=production
PORT=3003
JWT_SECRET=<openssl rand -hex 32>
ENCRYPTION_MASTER_KEY=<openssl rand -hex 32>
ANTHROPIC_API_KEY=sk-ant-...
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave
WEBHOOK_BASE_URL=https://<url-desta-api>.railway.app
```

> DATABASE_URL e REDIS_URL são injetadas automaticamente pelo Railway

4. Clique em **Deploy**
5. Após o deploy, copie a URL pública gerada (ex: `https://api-prod.railway.app`)

---

### 5. Serviço: Worker

1. **+ Add Service** → **GitHub Repo** → selecione o repo (mesmo repo, novo serviço)
2. Em **Settings → General**:
   - **Config File Path:** `apps/api/railway.worker.toml`
3. Em **Settings → Variables**, adicione as **mesmas variáveis da API**
4. Clique em **Deploy**

---

### 6. Serviço: Web (Frontend)

1. **+ Add Service** → **GitHub Repo** → selecione o repo
2. Em **Settings → General**:
   - **Config File Path:** `apps/web/railway.toml`
3. Em **Settings → Variables**, adicione:

```
NEXT_PUBLIC_API_URL=https://<url-da-api>.railway.app
```

4. Clique em **Deploy**
5. Após o deploy, copie a URL pública do frontend

---

### 7. Popular o banco com dados demo

Após a API estar no ar, rode o seed para criar o usuário demo:

No painel da API no Railway → **Settings → Deploy** → clique em **New Deployment** e aguarde.

Ou via Railway CLI:
```bash
railway run --service api node apps/api/prisma/seed.ts
```

**Login demo:**
- Email: `demo@reativa.com`
- Senha: `demo123`

---

## Resumo de custos Railway (estimativa)

| Serviço       | Plano    | Custo/mês  |
|---------------|----------|------------|
| API           | Hobby    | ~$5        |
| Worker        | Hobby    | ~$5        |
| Web           | Hobby    | ~$5        |
| PostgreSQL    | Hobby    | ~$5        |
| Redis         | Hobby    | ~$5        |
| **Total**     |          | **~$25/mês** |

> O plano Hobby custa $5/mês fixo + uso. Para um demo com poucos usuários, ficará perto disso.

---

## O que funciona no demo

| Feature | Status |
|---------|--------|
| Login / Registro | ✅ |
| Dashboard com métricas | ✅ |
| Leads + Funis de venda | ✅ |
| Campanhas de reativação | ✅ |
| Inbox / WhatsApp | ✅ (sem envio real sem Evolution) |
| Import de CSV | ⚠️ (precisa Cloudflare R2) |
| Envio real via WhatsApp | ⚠️ (precisa Evolution API) |

---

## Variáveis obrigatórias vs opcionais

### Obrigatórias (app não sobe sem elas)
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET` (mín. 32 chars)
- `ENCRYPTION_MASTER_KEY` (64 chars hex)

### Opcionais (funcionalidades específicas)
- `ANTHROPIC_API_KEY` → classificação IA das respostas
- `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` → envio WhatsApp
- `CLOUDFLARE_R2_*` → upload de CSV
