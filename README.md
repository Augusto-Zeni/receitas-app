# Receitas App — Documentação Completa

**Aplicação web para gerenciamento de receitas culinárias**, com autenticação de usuários, CRUD de receitas e categorização por tipo (doce/salgado).

---

## Sumário

- [Aplicação](#aplicação)
  - [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
  - [Interface Desenvolvida](#interface-desenvolvida)
- [Publicação na VM](#publicação-na-vm)
  - [Como Acessar a VM](#como-acessar-a-vm)
  - [Instalação das Ferramentas](#instalação-das-ferramentas)
  - [Implantação da Aplicação](#implantação-da-aplicação)
  - [URL de Acesso](#url-de-acesso)
- [Tempos Gastos](#tempos-gastos)
- [Entrega](#entrega)

---

## Aplicação

### Visão Geral

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express 5 + TypeScript |
| ORM | Prisma 7 |
| Banco de Dados | PostgreSQL 16 |
| Autenticação | JWT (jsonwebtoken) + bcrypt |
| Estado | Zustand (frontend) |
| Validação | Zod + React Hook Form |

---

### Modelagem do Banco de Dados

O banco de dados contém duas tabelas principais: **receita** e **usuario**.

#### Diagrama Entidade-Relacionamento

```
┌──────────────────────────────┐
│           usuario            │
├──────────────────────────────┤
│  id         INT (PK, AUTO)   │
│  nome       VARCHAR          │
│  login      VARCHAR (UNIQUE) │
│  senha      VARCHAR (hash)   │
│  situacao   BOOLEAN          │
└──────────────────────────────┘

┌──────────────────────────────┐
│           receita            │
├──────────────────────────────┤
│  id            INT (PK, AUTO)│
│  nome          VARCHAR       │
│  descricao     TEXT          │
│  data_registro TIMESTAMP     │
│  custo         DECIMAL(10,2) │
│  tipo_receita  CHAR(1)       │
│                 'D' = Doce   │
│                 'S' = Salgado│
└──────────────────────────────┘
```

> As duas entidades não possuem relação direta entre si. As receitas são compartilhadas entre todos os usuários autenticados.

#### Tabela `usuario`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INT | PK, AUTO INCREMENT | Identificador único |
| `nome` | VARCHAR | NOT NULL | Nome completo do usuário |
| `login` | VARCHAR | NOT NULL, UNIQUE | Nome de usuário para login |
| `senha` | VARCHAR | NOT NULL | Senha criptografada (bcrypt) |
| `situacao` | BOOLEAN | DEFAULT true | Ativo (true) ou inativo (false) |

#### Tabela `receita`

| Coluna | Tipo | Restrições | Descrição |
|--------|------|------------|-----------|
| `id` | INT | PK, AUTO INCREMENT | Identificador único |
| `nome` | VARCHAR | NOT NULL | Nome da receita |
| `descricao` | TEXT | NOT NULL | Descrição/modo de preparo |
| `data_registro` | TIMESTAMP | DEFAULT NOW() | Data e hora do cadastro |
| `custo` | DECIMAL(10,2) | NOT NULL | Custo em reais |
| `tipo_receita` | CHAR(1) | NOT NULL | `'D'` = Doce, `'S'` = Salgado |

#### API Endpoints

| Método | Rota | Autenticação | Descrição |
|--------|------|:------------:|-----------|
| POST | `/auth/login` | Não | Autenticar usuário, retorna JWT |
| GET | `/receitas` | Não | Listar receitas (filtros: `nome`, `tipo_receita`) |
| GET | `/receitas/:id` | Não | Buscar receita por ID |
| POST | `/receitas` | **Sim** | Criar nova receita |
| PUT | `/receitas/:id` | **Sim** | Atualizar receita |
| DELETE | `/receitas/:id` | **Sim** | Excluir receita |
| GET | `/usuarios` | **Sim** | Listar usuários |
| GET | `/usuarios/:id` | **Sim** | Buscar usuário por ID |
| POST | `/usuarios` | **Sim** | Criar usuário |
| PUT | `/usuarios/:id` | **Sim** | Atualizar usuário |
| DELETE | `/usuarios/:id` | **Sim** | Excluir usuário |

---

### Interface Desenvolvida

A aplicação possui duas telas principais:

#### Tela 1 — Login (`/`)

- Campos: **login** e **senha**
- Validação de formulário com Zod
- Feedback de erro via toast (sonner)
- Redirecionamento automático para `/receitas` após autenticação bem-sucedida

#### Tela 2 — Gerenciamento de Receitas (`/receitas`)

- **Cabeçalho** com nome do usuário logado e botão de logout
- **Busca** por nome da receita (campo de texto com filtro em tempo real)
- **Filtro** por tipo: Todos / Doce / Salgado
- **Tabela** com colunas: Nome, Tipo (badge colorido), Custo (R$), Data de Registro, Ações
- **Criar receita** — botão abre modal com formulário (nome, descrição, custo, tipo)
- **Editar receita** — ícone na linha abre modal pré-preenchido
- **Excluir receita** — ícone na linha abre diálogo de confirmação
- Todos os valores monetários formatados em R$ (padrão brasileiro)
- Datas exibidas no formato `dd/mm/aaaa`

---

## Publicação na VM

### Como Acessar a VM

```bash
# Acesso via SSH
ssh usuario@<IP_DA_VM>

---

### Instalação das Ferramentas

Execute os comandos abaixo **em ordem** após acessar a VM via SSH.

#### 1. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Instalar Node.js 22 (via NodeSource)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # Verificar: v22.x.x
npm -v     # Verificar: 10.x.x
```

#### 3. Instalar PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Verificar status
sudo systemctl status postgresql
```

#### 4. Configurar o banco de dados PostgreSQL

```bash
# Acessar o PostgreSQL como superusuário
sudo -u postgres psql

# Dentro do psql, executar:
CREATE DATABASE receitas;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE receitas TO postgres;
\q
```

#### 5. Instalar Git

```bash
sudo apt install -y git
git --version    # Verificar: git version 2.x.x
```

#### 6. Instalar PM2 (gerenciador de processos Node.js)

```bash
sudo npm install -g pm2
pm2 --version    # Verificar instalação
```

#### 7. Instalar Nginx (servidor web / proxy reverso)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Implantação da Aplicação

#### 1. Clonar o repositório

```bash
cd /home/ubuntu   # ou o diretório de sua preferência
git clone https://github.com/<seu-usuario>/receitas-app.git
cd receitas-app
```

#### 2. Configurar e iniciar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
nano .env
```

Edite o arquivo `.env` com os valores corretos para a VM:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/receitas
PORT=3000
JWT_SECRET=<gere-uma-chave-segura-aqui>
```

> Para gerar uma chave JWT segura: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

```bash
# Executar migrações do banco de dados
npx prisma migrate deploy

# Gerar o Prisma Client (obrigatório antes do seed)
npx prisma generate

# Popular o banco com dados iniciais (usuário admin)
npx prisma db seed

# Compilar o TypeScript
npm run build

# Iniciar com PM2 (manter em execução mesmo após reinicialização)
pm2 start dist/src/server.js --name receitas-backend
pm2 save
pm2 startup   # Seguir as instruções exibidas no terminal
```

#### 3. Configurar e fazer o build do Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente apontando para o backend
cp .env.example .env
nano .env
```

Edite o arquivo `.env`:

```env
VITE_API_URL=http://<IP_DA_VM>:3000
```

> Ou use o domínio, se houver: `VITE_API_URL=https://meudominio.com/api`

```bash
# Gerar build de produção
npm run build
# Os arquivos estáticos serão gerados em: frontend/dist/
```

#### 4. Configurar o Nginx

```bash
sudo nano /etc/nginx/sites-available/receitas-app
```

Cole o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name <IP_DA_VM>;   # ou seu domínio

    # Servir o frontend (arquivos estáticos)
    root /home/<seu-usuario>/receitas-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy reverso para o backend
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar o site e reiniciar o Nginx
sudo ln -s /etc/nginx/sites-available/receitas-app /etc/nginx/sites-enabled/
sudo nginx -t          # Verificar configuração
sudo systemctl reload nginx
```

#### 5. Abrir as portas no firewall (se aplicável)

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS (se aplicável)
sudo ufw enable
```

#### 6. Verificar que tudo está rodando

```bash
# Backend (PM2)
pm2 status
pm2 logs receitas-backend --lines 20

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Teste rápido da API
curl http://localhost:3000/receitas
```

---

### URL de Acesso

| Recurso | URL |
|---------|-----|
| **Aplicação Web** | `http://<IP_DA_VM>` |
| **API (Backend)** | `http://<IP_DA_VM>/api` ou `http://<IP_DA_VM>:3000` |

#### Credenciais de Acesso (padrão, criadas pelo seed)

| Campo | Valor |
|-------|-------|
| **Login** | `admin` |
| **Senha** | `admin123` |

> **Importante:** Altere a senha do usuário `admin` após o primeiro acesso em ambiente de produção.

---

## Tempos Gastos

| Etapa | Tempo |
|-------|-------|
| Planejamento e modelagem do banco de dados | 20 min |
| Desenvolvimento do backend (API + autenticação) | 90 min |
| Desenvolvimento do frontend (telas + integração) | 90 min |
| Testes e ajustes de integração | 20 min |
| **Total — Desenvolvimento da aplicação** | **~220 min** |
| Criação e configuração da VM | 15 min |
| Instalação das ferramentas (Node.js, PostgreSQL, Nginx, PM2) | 20 min |
| Configuração do banco de dados e variáveis de ambiente | 10 min |
| Deploy do backend e frontend na VM | 15 min |
| Configuração do Nginx e testes finais | 10 min |
| **Total — Publicação na VM** | **~70 min** |

---

## Estrutura do Repositório

```
receitas-app/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Servidor Express principal
│   │   ├── prisma.ts              # Inicialização do Prisma Client
│   │   ├── controllers/
│   │   │   ├── authController.ts  # Login e geração de JWT
│   │   │   ├── receitaController.ts
│   │   │   └── usuarioController.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── receitas.ts
│   │   │   └── usuarios.ts
│   │   └── middleware/
│   │       └── auth.ts            # Validação do token JWT
│   ├── prisma/
│   │   ├── schema.prisma          # Schema do banco de dados
│   │   ├── migrations/            # Migrações geradas pelo Prisma
│   │   └── seed.ts                # Dados iniciais
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Receitas.tsx
│   │   ├── store/
│   │   │   └── authStore.ts       # Estado de autenticação (Zustand)
│   │   ├── lib/
│   │   │   └── api.ts             # Axios com interceptors
│   │   └── types/
│   │       └── index.ts           # Interfaces TypeScript
│   └── package.json
│
├── docker-compose.yml             # PostgreSQL para desenvolvimento local
└── README.md                      # Esta documentação
```

---

## Desenvolvimento Local

```bash
# 1. Subir o banco de dados com Docker
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env   # ajuste DATABASE_URL se necessário
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev            # http://localhost:3000

# 3. Frontend (outro terminal)
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm run dev            # http://localhost:5173
```
