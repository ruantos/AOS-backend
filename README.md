# Recife Express

API de pedidos e entregas locais, com atendentes e entregadores autenticados e rastreamento público para clientes sem cadastro.

Projeto em desenvolvimento: base Express implementada e verificada por HTTP local em 26/11/2026. A persistência Prisma/PostgreSQL e a migração inicial também foram implementadas e verificadas em banco local descartável. Cadastro, login, logout e gerenciamento da própria conta foram implementados e verificados por HTTP com PostgreSQL local. CRUD HTTP das entidades de negócio, rastreamento e Swagger ainda não estão implementados.

## Desenvolvimento

Requer Node.js 22.12 ou superior, npm e PostgreSQL.

```bash
npm ci
cp .env.example .env
npm run db:generate
```

Configure `DATABASE_URL` no `.env` com a conexão de um banco PostgreSQL vazio de desenvolvimento e defina `JWT_SECRET` com pelo menos 32 bytes aleatórios. Para gerar o segredo localmente, execute `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(48).toString('hex'))"` e guarde o resultado apenas no `.env`. Depois:

```bash
npm run db:deploy
npm run dev
```

Se Node.js/npm estiverem instalados via NVM, ative o ambiente antes de executar os comandos (`nvm use 24`).

`npm start` inicia sem observação de arquivos. `PORT` define a porta local, com padrão 3000. `DATABASE_URL` configura o PostgreSQL; `JWT_SECRET` assina os tokens. `JWT_TTL_SECONDS` define sua duração, com padrão de 3600 segundos e intervalo permitido de 60 a 86400. Seus valores não devem ser versionados. As versões resolvidas estão registradas no `package-lock.json`.

As rotas de autenticação e conta própria estão disponíveis abaixo. Rotas ainda não implementadas retornam 404 em JSON.

## Persistência

- `npm run db:validate`: valida o esquema Prisma.
- `npm run db:generate`: gera o cliente; executar após `npm ci` e alterações no esquema, inclusive quando scripts de instalação forem bloqueados pelo npm.
- `npm run db:deploy`: aplica migrações pendentes no banco configurado. Use inicialmente um banco vazio; não executa seed nem apaga dados existentes.
- `npm run db:status`: consulta o estado das migrações.
- `npm run db:migrate -- --name nome_da_alteracao`: cria novas migrações em desenvolvimento; requer permissão para o banco auxiliar (shadow database). Não usar em produção.

O esquema contém sete entidades de negócio e `Session`. Valores monetários usam `Decimal(12,2)`; o total do pedido será calculado pelos itens nos serviços. `deletedAt` permite exclusão lógica de clientes, produtos, pedidos e entregas; usuários são desativados com `active`. O vínculo único entre pedido e entrega permanece após exclusão lógica. O histórico distingue eventos do pedido e da entrega por campos tipados. Notas internas não serão retornadas pela consulta pública.

A migração inclui restrições SQL para preços não negativos, quantidades positivas, expiração de sessão posterior à criação e consistência do tipo de evento no histórico. O acesso à conta própria já é protegido por autenticação. Permissões e propriedade das entidades de negócio, transições e cópias históricas serão validadas nos serviços das próximas etapas; o esquema isoladamente não implementa essas regras.

A conexão compartilhada está em `src/config/database.js`; os serviços de autenticação já a utilizam. Não é necessário publicar um endpoint público de banco. O PostgreSQL usado na verificação foi temporário e não é a configuração de desenvolvimento ou de produção da equipe.

Prisma e seu adaptador PostgreSQL estão fixados na mesma versão. O override `effect: 3.22.5` corrige uma vulnerabilidade transitiva do CLI. A configuração JavaScript segue a [documentação do Prisma](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

## Autenticação e conta própria

| Método | Rota | Acesso e corpo JSON |
|---|---|---|
| POST | `/auth/signup` | Público; `name`, `email`, `password`, `role` (`ATTENDANT` ou `COURIER`) |
| POST | `/auth/login` | Público; `email`, `password` |
| POST | `/auth/logout` | Bearer; revoga a sessão atual, retorna 204 |
| GET | `/users/me` | Bearer; consulta a conta autenticada |
| PATCH | `/users/me` | Bearer; altera um ou mais campos: `name`, `email`, `password` |
| DELETE | `/users/me` | Bearer; desativa a própria conta e revoga suas sessões, retorna 204 |

Cadastro retorna 201 com `user`; não faz login automaticamente. Login retorna `accessToken`, `tokenType`, `expiresAt` e `user`. Use o token no cabeçalho `Authorization: Bearer <accessToken>` das chamadas protegidas. Nenhuma resposta contém hash ou senha. E-mails são armazenados em minúsculas, sem espaços nas extremidades; nomes têm entre 2 e 120 caracteres. Senhas têm pelo menos 8 caracteres e no máximo 72 bytes em UTF-8, sem remoção de espaços ou truncamento.

A assinatura JWT usa HS256, emissor/audiência fixos, expiração e identificador de sessão. O middleware consulta sessão e conta ativa no PostgreSQL a cada chamada protegida. Logout invalida o token no servidor; outras sessões da mesma conta permanecem válidas. Trocar a senha revoga todas as sessões, inclusive a atual: faça novo login. Desativação impede login e revoga todas as sessões. Não há reativação pública nem troca de perfil por atualização.

As rotas `/users/me` determinam o usuário pelo token; não recebem ID de conta. Campos extras são rejeitados, inclusive `role`, `active`, `id` e `passwordHash`. O middleware `authorize(...roles)` está disponível para restringir as rotas de negócio nas próximas etapas; nesta etapa ambos os perfis podem gerenciar a própria conta.

Erros retornam `{ "error": { "code": "...", "message": "..." } }`, com `details` contendo apenas campo e mensagem em falhas de validação. Dados inválidos retornam 400; credenciais ou sessões inválidas, 401; perfil sem permissão, 403; e-mail duplicado, 409. A desativação preserva o e-mail único e o histórico da conta.

A implementação segue as referências de [JWT](https://github.com/auth0/node-jsonwebtoken), [validação de campos](https://express-validator.github.io/docs/api/check-exact/) e [limite de senha do bcrypt](https://github.com/dcodeIO/bcrypt.js).

## Referências

- [Escopo](docs/Escopo.md)
- [Plano e verificação por etapa](docs/Plano.md)
- [Instruções de desenvolvimento](Skills/AGENTS.md)

## Equipe e publicação

Nomes e RAs dos integrantes, URL da Vercel e links de entrega: pendentes de preenchimento pela equipe.
