# Documentação da API (baseada em `src/app.ts`)

Este documento descreve, em detalhe, as funções, middlewares e rotas implementadas em `src/app.ts`.

> Observação: os trechos de código abaixo mostram a assinatura das funções/handlers conforme implementadas no arquivo.

## createConnection

Descrição
- Função utilitária que cria e retorna uma conexão com o banco MySQL usando `mysql2/promise`.

Lógica
- Constrói a configuração de conexão com host, usuário, senha, nome do banco e porta.
- Retorna a Promise de conexão para ser usada com `await` nas rotas e middlewares.

Assinatura
```ts
function createConnection()
```

Tratamento de erros
- A função em si não trata erros; as chamadas que a utilizam (rotas/middleware) devem envolver `try/catch/finally` e garantir `connection.end()`.

---

## authMiddleware (middleware global de autenticação)

Descrição
- Middleware global registrado com `app.use(...)` que protege as rotas da API, validando JWTs quando necessário.

Lógica
- Mantém uma lista (`unprotectedRoutes`) com rotas públicas (login, registro e listagem pública de eventos).
- Para cada requisição, verifica se a rota atual é pública — se sim, chama `next()` e permite o acesso.
- Caso seja rota protegida, lê o header `Authorization`, extrai o token Bearer e valida com `jwt.verify(token, '123456')`.
- Ao verificar o token, se válido, abre conexão com o banco para buscar o usuário por `id` contido no payload e anexa `req.user` com os dados do usuário.
- Se qualquer checagem falhar (token ausente, inválido ou usuário não encontrado), responde com `401` e mensagem apropriada.

Assinatura (representativa)
```ts
async function authMiddleware(req, res, next)
```

Tratamento de erros
- O middleware captura exceções no bloco `try/catch`. Em caso de erro na verificação do token, retorna `401` com a mensagem "Falha na autenticação do token".
- Se o token for ausente, retorna `401` com "Token não aprovado".
- Se o usuário não for encontrado após buscar no banco, retorna `401` com "Usuário não encontrado".

---

## POST /auth/login

Descrição
- Autentica um usuário (por email e senha) e retorna um token JWT em caso de sucesso.

Lógica
- Recebe `email` e `password` no corpo da requisição.
- Abre uma conexão com o banco e busca o usuário por `email`.
- Se encontrar o usuário, compara a senha recebida com o hash armazenado usando `bcrypt.compareSync`.
- Se a senha for válida, gera um token JWT assinado com o segredo (ex.: `'123456'`) e expiração de `1h` e retorna `{ token }`.
- Em caso de credenciais inválidas, responde com `401` e mensagem "Credenciais inválidas".
- Garante que a conexão com o banco seja encerrada no bloco `finally`.

Assinatura
```ts
app.post("/auth/login", async (req, res) => { ... })
```

Tratamento de erros
- O handler usa `try/finally` para garantir `connection.end()`; exceções não capturadas serão propagadas ao Express.
- Em credenciais inválidas o retorno é `401` com mensagem clara.

---

## POST /partners/register

Descrição
- Registra um parceiro: cria um registro em `users` (nome, email, senha hashed, created_at) e em `partners` (user_id, company_name, created_at).

Lógica
- Recebe `name`, `email`, `password`, `company_name` no corpo da requisição.
- Calcula `createdAt` e gera `hashedPassword` com `bcrypt.hashSync(..., 10)`.
- Insere primeiro na tabela `users`, obtendo `userId` (insertId).
- Insere na tabela `partners` referenciando `userId`.
- Retorna `201` com JSON contendo `id` do parceiro, nome, userId, company_name e createdAt.
- Fecha a conexão no bloco `finally`.

Assinatura
```ts
app.post("/partners/register", async (req, res) => { ... })
```

Tratamento de erros
- Erros de banco de dados podem propagar exceções; o `finally` garante `connection.end()`.
- Endpoint retorna `201` em sucesso; não há validação explícita de duplicidade de email na implementação atual (recomendado adicionar).

---

## GET /partners

Descrição
- Rota declarada mas sem implementação no código atual.

Lógica
- Handler vazio; atualmente não retorna dados.

Assinatura
```ts
app.get("/partners", (req, res) => { ... })
```

Tratamento de erros
- Sem implementação; deve ser implementada para listar parceiros ou retornar dados de perfil.

---

## POST /customers/register

Descrição
- Registra um cliente: cria um `user` e um registro em `customers` com `address` e `phone`.

Lógica
- Recebe `name`, `email`, `password`, `address`, `phone` no corpo.
- Gera `createdAt`, faz `hash` da senha e insere em `users`.
- Usa `userId` resultante para inserir em `customers` com `address`, `phone` e `created_at`.
- Retorna `201` com dados básicos do cliente.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.post("/customers/register", async (req, res) => { ... })
```

Tratamento de erros
- Mesma observação: validações de entrada e checagem de emails duplicados não implementadas.

---

## POST /events

Descrição
- Rota declarada mas sem implementação funcional no código atual; provavelmente planejada para criação pública de eventos ou para fins administrativos.

Lógica
- Atualmente apenas extrai os campos do corpo (`name, description, date, location`) e não persiste nada.

Assinatura
```ts
app.post("/events", (req, res) => { ... })
```

Tratamento de erros
- Sem implementação.

---

## GET /events

Descrição
- Lista todos os eventos da tabela `events` e retorna como JSON.

Lógica
- Abre conexão com o banco e executa `SELECT * FROM events`.
- Retorna a lista de eventos como JSON.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.get("/events", async (req, res) => { ... })
```

Tratamento de erros
- Em caso de erro de query, a exceção será propagada para o handler de erro do Express; a conexão é finalizada no `finally`.

---

## GET /events/:eventID

Descrição
- Busca e retorna um evento específico por `id`.

Lógica
- Lê `eventID` de `req.params`.
- Executa `SELECT * FROM events WHERE id = ?` com `eventID` como parâmetro.
- Se não encontrar o evento, retorna `404` com "Evento não encontrado".
- Se encontrado, retorna o objeto do evento.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.get("/events/:eventID", async (req, res) => { ... })
```

Tratamento de erros
- Retorna `404` quando não encontrado; erros de banco propagam exceções padrão.

---

## POST /partners/events

Descrição
- Permite que um parceiro autenticado crie um evento associado ao seu registro `partners`.

Lógica
- Recupera `req.user!.id` (definido pelo middleware de autenticação) para identificar o usuário logado.
- Busca o parceiro relacionado a esse `userId` com `SELECT * FROM partners WHERE user_id = ?`.
- Se não existir parceiro para o `userId`, retorna `403` (Acesso não autorizado).
- Se for parceiro válido, converte `date` em `Date`, gera `createdAt` e insere na tabela `events` com `partners_id` = `partner.id`.
- Retorna `201` com os dados do evento recém-criado.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.post("/partners/events", async (req, res) => { ... })
```

Tratamento de erros
- Retorna `403` quando o usuário autenticado não é um parceiro.
- Erros de banco provocam exceções padrão; `finally` garante encerramento da conexão.

---

## GET /partners/events

Descrição
- Lista todos os eventos pertencentes ao parceiro autenticado.

Lógica
- Usa `req.user!.id` para buscar a linha do parceiro (`SELECT * FROM partners WHERE user_id = ?`).
- Se não for parceiro, retorna `403`.
- Caso seja parceiro, consulta `events` por `partners_id` e retorna os resultados.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.get("/partners/events", async (req, res) => { ... })
```

Tratamento de erros
- Retorna `403` quando o usuário autenticado não é um parceiro.

---

## GET /partners/events/:eventId

Descrição
- Recupera um evento específico pertencente ao parceiro autenticado.

Lógica
- Lê `eventId` de `req.params` e `userId` de `req.user!.id`.
- Verifica se o `userId` corresponde a um parceiro; se não, retorna `403`.
- Executa `SELECT * FROM events WHERE partners_id = ? and id = ?` passando `partner.id` e `eventId`.
- Se o evento não existir, retorna `404`.
- Caso exista, retorna o evento.
- Fecha a conexão no `finally`.

Assinatura
```ts
app.get("/partners/events/:eventId", async (req, res) => { ... })
```

Tratamento de erros
- `403` quando a conta autenticada não é parceira; `404` quando o evento não é encontrado.

---

## app.listen (inicialização do servidor)

Descrição
- Inicializa o servidor na porta `3000` e realiza uma rotina de limpeza (truncate) nas tabelas de testes ao iniciar.

Lógica
- Cria conexão com o banco e executa sequencialmente:
  - `SET FOREIGN_KEY_CHECKS = 0` (desabilita temporariamente verificação de fk),
  - `TRUNCATE TABLE users`, `customers`, `partners`, `events`,
  - `SET FOREIGN_KEY_CHECKS = 1` (reabilita verificações).
- Em seguida, inicia o listener do Express (`app.listen(3000, ...)`) e loga URL no console.

Assinatura
```ts
app.listen(3000, async () => { ... })
```

Tratamento de erros
- Operações de truncation podem falhar se houver problemas de permissão/conexão; não há `try/catch` explícito no `listen` block — recomenda-se envolver essa rotina em `try/catch` para log apropriado e fallback.

---

## Tratamento de erros geral e recomendações

- A aplicação usa `try/finally` em handlers que interagem com o banco para garantir `connection.end()`; isso previne conexões abertas.
- Os handlers respondem com códigos HTTP apropriados em vários cenários:
  - `201` para criação bem-sucedida;
  - `401` para credenciais inválidas ou falhas de autenticação;
  - `403` para acesso não autorizado (quando o usuário autenticado não tem privilégio de parceiro);
  - `404` para recursos não encontrados.
- Recomendações adicionais:
  - Centralizar o tratamento de erros com um error-handling middleware (ex.: `app.use((err, req, res, next) => { ... })`).
  - Remover valores sensíveis hard-coded (ex.: segredo JWT) e usar variáveis de ambiente via `dotenv`.
  - Adicionar validação de payloads com `Joi`/`zod` e checagem de duplicidade de emails antes de inserir.

---

## Resumo rápido das rotas

- `GET /` — Health check
- `POST /auth/login` — Login (retorna JWT)
- `POST /partners/register` — Registro de parceiro
- `GET /partners` — (sem implementação)
- `POST /customers/register` — Registro de cliente
- `POST /events` — (sem implementação)
- `GET /events` — Listar eventos (público)
- `GET /events/:eventID` — Obter evento por ID (público)
- `POST /partners/events` — Criar evento (parceiro autenticado)
- `GET /partners/events` — Listar eventos do parceiro autenticado
- `GET /partners/events/:eventId` — Obter evento do parceiro (autenticado)