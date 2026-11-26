# Recife Express

API de pedidos e entregas locais, com atendentes e entregadores autenticados e rastreamento público para clientes sem cadastro.

Projeto em desenvolvimento: base Express implementada e verificada por HTTP local em 26/11/2026. A persistência Prisma/PostgreSQL e a migração inicial também foram implementadas e verificadas em banco local descartável. Autenticação, CRUD HTTP, rastreamento e Swagger ainda não estão implementados.

## Desenvolvimento

Requer Node.js 22.12 ou superior, npm e PostgreSQL.

```bash
npm ci
cp .env.example .env
npm run db:generate
```

Configure `DATABASE_URL` no `.env` com a conexão de um banco PostgreSQL vazio de desenvolvimento. Depois:

```bash
npm run db:deploy
npm run dev
```

Se Node.js/npm estiverem instalados via NVM, ative o ambiente antes de executar os comandos (`nvm use 24`).

`npm start` inicia sem observação de arquivos. `PORT` define a porta local, com padrão 3000. `DATABASE_URL` configura o PostgreSQL; `JWT_SECRET` será utilizado na etapa de autenticação. Seus valores não devem ser versionados. As versões resolvidas estão registradas no `package-lock.json`.

O servidor ainda não tem rotas de negócio; requisições retornam 404 em JSON.

## Persistência

- `npm run db:validate`: valida o esquema Prisma.
- `npm run db:generate`: gera o cliente; executar após `npm ci` e alterações no esquema, inclusive quando scripts de instalação forem bloqueados pelo npm.
- `npm run db:deploy`: aplica migrações pendentes no banco configurado. Use inicialmente um banco vazio; não executa seed nem apaga dados existentes.
- `npm run db:status`: consulta o estado das migrações.
- `npm run db:migrate -- --name nome_da_alteracao`: cria novas migrações em desenvolvimento; requer permissão para o banco auxiliar (shadow database). Não usar em produção.

O esquema contém sete entidades de negócio e `Session`. Valores monetários usam `Decimal(12,2)`; o total do pedido será calculado pelos itens nos serviços. `deletedAt` permite exclusão lógica de clientes, produtos, pedidos e entregas; usuários são desativados com `active`. O vínculo único entre pedido e entrega permanece após exclusão lógica. O histórico distingue eventos do pedido e da entrega por campos tipados. Notas internas não serão retornadas pela consulta pública.

A migração inclui restrições SQL para preços não negativos, quantidades positivas, expiração de sessão posterior à criação e consistência do tipo de evento no histórico. Perfis, propriedade dos dados, transições e cópias históricas serão validados nos serviços das próximas etapas; o esquema isoladamente não implementa essas regras.

A conexão compartilhada está em `src/config/database.js`; a base Express ainda não a utiliza, pois não há rotas de negócio. Não é necessário publicar um endpoint público de banco. O PostgreSQL usado na verificação foi temporário e não é a configuração de desenvolvimento ou de produção da equipe.

Prisma e seu adaptador PostgreSQL estão fixados na mesma versão. O override `effect: 3.22.5` corrige uma vulnerabilidade transitiva do CLI. A configuração JavaScript segue a [documentação do Prisma](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

## Referências

- [Escopo](docs/Escopo.md)
- [Plano e verificação por etapa](docs/Plano.md)
- [Instruções de desenvolvimento](Skills/AGENTS.md)

## Equipe e publicação

Nomes e RAs dos integrantes, URL da Vercel e links de entrega: pendentes de preenchimento pela equipe.
