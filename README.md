# Recife Express

API de pedidos e entregas locais, com atendentes e entregadores autenticados e rastreamento público para clientes sem cadastro.

Projeto em desenvolvimento: somente a base Express foi escrita. Não foi executada neste ambiente, que não possui Node.js/npm. Autenticação, banco, CRUD, rastreamento e Swagger ainda não estão implementados.

## Desenvolvimento

Requer Node.js 22 ou superior e npm.

```bash
npm install
cp .env.example .env
npm run dev
```

`npm start` inicia sem observação de arquivos. `PORT` define a porta local, com padrão 3000. `DATABASE_URL` e `JWT_SECRET` serão utilizados nas próximas etapas; seus valores não devem ser versionados. O lockfile será gerado na primeira instalação e deverá ser versionado.

O servidor ainda não tem rotas de negócio; requisições retornam 404 em JSON.

## Referências

- [Escopo](docs/Escopo.md)
- [Plano e verificação por etapa](docs/Plano.md)
- [Instruções de desenvolvimento](Skills/AGENTS.md)

## Equipe e publicação

Nomes e RAs dos integrantes, URL da Vercel e links de entrega: pendentes de preenchimento pela equipe.
