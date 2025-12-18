
# API de Vendas de Ingressos

## 🚀 Descrição do Projeto

- O que faz esta API?
	- Serviço backend para autenticação, gerenciamento de usuários (parceiros e clientes), e gerenciamento de eventos (criação, listagem e consulta). Projetada para ser a base de um sistema de venda de ingressos, incluindo registro e autenticação de usuários, criação e gerenciamento de eventos por parceiros, e endpoints públicos para visualização de eventos.

- Qual a principal tecnologia de backend utilizada?
	- Desenvolvida em TypeScript com Express como framework HTTP. Utiliza `mysql2/promise` para acesso ao MySQL, `bcrypt` para hashing de senhas e `jsonwebtoken` (JWT) para autenticação.

- Objetivo principal
	- Fornecer um serviço robusto e seguro para autenticação e operações relacionadas a eventos e usuários, com práticas recomendadas de segurança (hash de senha, tokens JWT, prepared statements) e possibilidade de uso em ambiente conteinerizado com Docker.

## 🛠️ Requisitos e Instalação

### Requisitos Mínimos

- Node.js (versão LTS recomendada)
- npm
- Docker Desktop (ou Docker Engine) para executar o MySQL via `docker compose`
- Extensão REST Client (para Visual Studio Code) ou Postman para testes (opcional)

### Dependências (comandos NPM)

Instalação básica do projeto:

```bash
npm init -y
npm install express bcrypt jsonwebtoken mysql2
```

Dependências de desenvolvimento (exemplos recomendados):

```bash
npm install --save-dev typescript tsx nodemon
npm i --save-dev @types/express @types/bcrypt @types/jsonwebtoken @types/node
```

> Observação: `nodemon` e `tsx` são úteis durante desenvolvimento.

### Configuração Inicial

1. Inicialize o TypeScript (gera `tsconfig.json`):

```bash
npx tsc --init
```

2. Ajuste `tsconfig.json` conforme necessário (target, moduleResolution, outDir etc.).

3. Verifique as configurações de conexão com o banco em `src/app.ts` ou defina variáveis de ambiente conforme sua preferência (ver seção de Variáveis abaixo).

## ⚙️ Instruções de Uso

### 1. Iniciar o Banco de Dados (MySQL via Docker)

O projeto já contém um `docker-compose.yaml` que inicializa um container MySQL e monta o arquivo `db.sql` para criação das tabelas.

- Ligar o BD (modo background):

```bash
docker compose up -d
```

- Desligar o BD:

```bash
docker compose down
```

### 2. Iniciar o Servidor da Aplicação

- Comando (desenvolvimento):

```bash
npx nodemon
```

- Porta padrão usada pelo servidor: `3000` (endpoint base: `http://localhost:3000/`).

### Endpoints principais

- `POST /auth/login` — Autentica usuário e retorna token JWT.
- `POST /partners/register` — Registra novo parceiro (gera usuário + parceiro).
- `POST /customers/register` — Registra novo cliente (gera usuário + cliente).
- `POST /partners/events` — Cria evento (requer autenticação de parceiro).
- `GET /events` — Lista todos os eventos (rota pública).
- `GET /events/:eventID` — Consulta evento por ID (rota pública).
- `GET /partners/events` — Lista eventos do parceiro autenticado.
- `GET /partners/events/:eventId` — Consulta evento específico do parceiro autenticado.

O projeto contém um arquivo de coleção de testes `api.http` com exemplos prontos de payloads e uso de tokens.

## 🔐 Variáveis de Ambiente e Configurações Recomendadas

- `JWT_SECRET` — segredo para assinar tokens JWT (ex.: `123456` em dev, usar segredo forte em produção).
- `DB_HOST` — host do MySQL (ex.: `localhost` ou serviço docker)
- `DB_PORT` — porta para conexão com MySQL (ex.: `3306`, `3307` ou `33070` conforme mapeamento)
- `DB_USER` — usuário do banco (ex.: `root`)
- `DB_PASSWORD` — senha do usuário (ex.: `root`)
- `DB_NAME` — nome do banco (ex.: `tickets`)

Sugestão: carregar configurações via `.env` e bibliotecas como `dotenv` para não deixar segredos hard-coded.

## 🧪 Testes e Execução de Requisições

- Use `api.http` (fornecido no repositório) ou Postman para executar os fluxos:
	- Registro de parceiro/cliente
	- Login para obter token JWT
	- Criação de evento como parceiro (incluir `Authorization: Bearer <token>`)

Exemplo de fluxo rápido (usando `api.http` já preparado):

- Realize `POST /partners/register` para criar parceiro
- Faça `POST /auth/login` para obter `token`
- Use o token para `POST /partners/events` e criar eventos

