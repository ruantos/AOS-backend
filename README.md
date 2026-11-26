# Recife Express

API de pedidos e entregas locais, com atendentes e entregadores autenticados e rastreamento público para clientes sem cadastro.

Projeto em desenvolvimento. Implementados e verificados em PostgreSQL local: base Express, persistência, autenticação, conta própria, CRUD de contatos/produtos/pedidos/entregas, itens, histórico e URLs compostas. O endpoint público de rastreamento está implementado e verificado por HTTP. Este repositório contém somente o backend. Swagger, seed, coleção Postman e publicação ainda estão pendentes.

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

As rotas de autenticação, conta própria, contatos, produtos, pedidos, itens e entregas estão disponíveis abaixo. Rotas ainda não implementadas retornam 404 em JSON.

## Persistência

- `npm run db:validate`: valida o esquema Prisma.
- `npm run db:generate`: gera o cliente; executar após `npm ci` e alterações no esquema, inclusive quando scripts de instalação forem bloqueados pelo npm.
- `npm run db:deploy`: aplica migrações pendentes no banco configurado. Use inicialmente um banco vazio; não executa seed nem apaga dados existentes.
- `npm run db:status`: consulta o estado das migrações.
- `npm run db:migrate -- --name nome_da_alteracao`: cria novas migrações em desenvolvimento; requer permissão para o banco auxiliar (shadow database). Não usar em produção.

O esquema contém sete entidades de negócio e `Session`. Valores monetários usam `Decimal(12,2)`; o total do pedido é calculado pelos itens nos serviços, sem receber valores do cliente. `deletedAt` permite exclusão lógica de clientes, produtos, pedidos e entregas; usuários são desativados com `active`. O vínculo único entre pedido e entrega permanece após exclusão lógica. O histórico distingue eventos do pedido e da entrega por campos tipados. Notas internas não serão retornadas pela consulta pública.

A migração inclui restrições SQL para preços não negativos, quantidades positivas, expiração de sessão posterior à criação e consistência do tipo de evento no histórico. Conta própria, contatos, produtos e pedidos já possuem autenticação e isolamento por usuário. Pedidos possuem transições validadas e preços históricos nos itens. Entregas possuem autorização por atribuição, endereço histórico e sincronização de estados com o pedido; o esquema isoladamente não implementa essas regras.

A conexão compartilhada está em `src/config/database.js`, com sessões PostgreSQL em UTC para evitar deslocamento de datas; os serviços de autenticação e das entidades de negócio já a utilizam. Não é necessário publicar um endpoint público de banco. O PostgreSQL usado na verificação foi temporário e não é a configuração de desenvolvimento ou de produção da equipe.

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

As rotas `/users/me` determinam o usuário pelo token; não recebem ID de conta. Campos extras são rejeitados, inclusive `role`, `active`, `id` e `passwordHash`. O middleware `authorize(...roles)` restringe contatos e produtos ao atendente; ambos os perfis podem gerenciar a própria conta.

Erros retornam `{ "error": { "code": "...", "message": "..." } }`, com `details` contendo apenas campo e mensagem em falhas de validação. Dados inválidos retornam 400; credenciais ou sessões inválidas, 401; perfil sem permissão, 403; e-mail duplicado, 409. A desativação preserva o e-mail único e o histórico da conta.

A implementação segue as referências de [JWT](https://github.com/auth0/node-jsonwebtoken), [validação de campos](https://express-validator.github.io/docs/api/check-exact/) e [limite de senha do bcrypt](https://github.com/dcodeIO/bcrypt.js).

## Contatos de destinatários e produtos

Todas as rotas abaixo exigem `Authorization: Bearer <accessToken>` de um atendente (`ATTENDANT`). Entregadores recebem 403; chamadas sem sessão válida recebem 401. O cliente não ganha conta ao cadastrar um contato.

| Método | Contatos | Produtos | Resposta |
|---|---|---|---|
| POST | `/customers` | `/products` | 201 com `customer` ou `product` |
| GET | `/customers` | `/products` | 200 com `customers` ou `products` |
| GET | `/customers/:id` | `/products/:id` | 200 com o registro |
| PATCH | `/customers/:id` | `/products/:id` | 200 com o registro atualizado |
| DELETE | `/customers/:id` | `/products/:id` | 204 sem corpo |

As listagens retornam somente registros não excluídos do próprio atendente, ordenados por criação decrescente e ID em caso de empate. Consulta, edição e exclusão usam o proprietário autenticado no filtro do banco. IDs de outro atendente, inexistentes ou excluídos retornam 404; UUID inválido retorna 400. Não há paginação nesta versão.

Contato: criação exige `name` (2 a 120 caracteres), `phone` (até 30), `street` (até 200), `number` (até 30), `neighborhood` e `city` (até 120 cada). Esses campos são textos obrigatórios, sem espaços nas extremidades; `number` aceita valores como `s/n`. `complement` (até 200) e `reference` (até 300) são opcionais e aceitam `null` para limpeza.

```json
{
  "name": "Destinatário fictício",
  "phone": "(81) 00000-0000",
  "street": "Rua de exemplo",
  "number": "10",
  "neighborhood": "Centro",
  "city": "Recife"
}
```

Produto: criação exige `name` (2 a 120 caracteres) e `price`. `description` é opcional, aceita até 1000 caracteres ou `null`; `active` é um booleano opcional com padrão `true`. Preços aceitam número JSON ou texto decimal sem espaços, sinal ou notação exponencial, de 0 até 9999999999.99, com no máximo duas casas decimais. Para evitar perda de precisão no cliente, prefira enviar preço como texto. As respostas usam texto com duas casas decimais.

```json
{
  "name": "Produto de exemplo",
  "description": "Descrição opcional",
  "price": "10.35",
  "active": true
}
```

PATCH aceita um ou mais dos mesmos campos, mantendo os demais valores. Campos extras são rejeitados, inclusive `id`, `createdById`, `deletedAt` e datas de auditoria. Corpo vazio, tipos ou limites inválidos retornam 400.

DELETE faz exclusão lógica (`deletedAt`), preservando os registros vinculados e os preços históricos de itens. No produto também define `active=false`. Um registro excluído deixa de aparecer nas consultas e não pode ser editado, restaurado ou excluído novamente pela API. Um produto apenas inativo continua visível ao dono e pode ser reativado por PATCH. Produtos inativos ou excluídos não podem ser incluídos em pedidos. Alterações de quantidade também exigem produto ativo; a remoção de um item indisponível é permitida enquanto o pedido aceitar edição e mantiver outro item.

Verificação local da etapa 4: 143 respostas HTTP conferidas em PostgreSQL temporário, incluindo CRUD, isolamento entre dois atendentes, bloqueio de dois entregadores, validações, exclusão de registros vinculados e sessão revogada. Nenhuma suíte automatizada foi adicionada. Não foram necessárias novas dependências nem alterações no esquema do banco.

## Pedidos, itens e relacionamentos

As rotas exigem sessão de atendente e limitam o acesso aos próprios pedidos. Entregadores recebem 403, sessão inválida recebe 401, e recurso inexistente/alheio/excluído recebe 404. O item deve pertencer ao pedido da URL; trocar o ID do pedido não permite acessar um item de outro pedido.

| Método | Rota | Comportamento |
|---|---|---|
| POST | `/orders` | Cria pedido com contato e itens, retorna 201 com `order` |
| GET | `/orders` | Lista pedidos, retorna `orders` |
| GET | `/orders/:orderId` | Consulta `order`, incluindo itens, total e histórico |
| PATCH | `/orders/:orderId` | Atualiza `notes` e/ou `status`, retorna `order` |
| DELETE | `/orders/:orderId` | Exclui logicamente, retorna 204 |
| GET | `/customers/:customerId/orders` | Lista pedidos do contato próprio não excluído |
| POST | `/customers/:customerId/orders` | Cria pedido para o contato da URL; omitir `customerId` do corpo |
| GET | `/orders/:orderId/items` | Lista `items` |
| POST | `/orders/:orderId/items` | Adiciona item, retorna 201 com `item` e `total` |
| GET | `/orders/:orderId/items/:itemId` | Consulta `item` |
| PATCH | `/orders/:orderId/items/:itemId` | Altera somente `quantity`, retorna `item` e `total` |
| DELETE | `/orders/:orderId/items/:itemId` | Remove item, retorna 204 |

Exemplo de criação por `/orders`:

```json
{
  "customerId": "UUID_DO_CONTATO",
  "notes": "Observação opcional",
  "items": [
    { "productId": "UUID_DO_PRODUTO", "quantity": 2 }
  ]
}
```

Um pedido contém de 1 a 100 produtos distintos; cada quantidade é um número inteiro JSON entre 1 e 10000. O contato e os produtos precisam pertencer ao atendente e não estar excluídos; produtos também devem estar ativos. Produtos repetidos no corpo são rejeitados (400); adicionar novamente um produto existente retorna 409. Não é possível remover o último item (409). Não há substituição do contato do pedido ou do produto de um item por PATCH.

O backend copia `price` para `unitPrice` na inclusão e calcula `subtotal` e `total` com aritmética decimal; respostas monetárias são textos com duas casas. Alterar preço do catálogo ou quantidade do item não altera o preço histórico já copiado. O corpo não aceita `total`, `unitPrice`, proprietário, status inicial, datas nem campos extras. Criação de pedido/itens/histórico e alterações de status são transacionais; as mutações de um mesmo pedido são serializadas no banco.

Itens e observações só podem ser editados em `RECEIVED` ou `PREPARING`. Notas aceitam texto de até 1000 caracteres ou `null`. O fluxo manual nesta etapa é `RECEIVED → PREPARING → READY`; esses três estados também permitem cancelamento para `CANCELLED`, desde que não exista entrega não excluída vinculada. Estados inválidos no corpo retornam 400; transições não permitidas ou edição fora dos estados previstos retornam 409. Repetir o status atual não duplica o histórico. `IN_DELIVERY` e `COMPLETED` são controlados pelo serviço de entregas; não é possível forçá-los pelo PATCH de pedido.

Criação registra um evento `RECEIVED`. Cada mudança de estado registra novo evento, autor e data, retornados em `order.history`. DELETE preserva itens e histórico, marca `deletedAt` e cancela pedidos ainda não concluídos, registrando o cancelamento se necessário. Pedidos em entrega ou com entrega ativa (`ASSIGNED`/`OUT_FOR_DELIVERY`) não excluída não podem ser excluídos (409). Entregas terminais (`DELIVERED`/`FAILED`) permitem excluir logicamente o pedido, preservando seu status terminal e histórico; a entrega deixa de aparecer nas consultas quando o pedido é excluído. Pedidos excluídos desaparecem das consultas e não podem ser editados. Excluir um contato não apaga seus pedidos, que continuam disponíveis por `/orders`; a rota composta exige contato não excluído.

GET `/orders` e GET `/customers/:customerId/orders` aceitam `status`, `from` e `to`. Datas filtram `createdAt`, com limites inclusivos e timestamp ISO 8601 contendo fuso, como `2026-11-26T00:00:00Z`. A data final não pode ser anterior à inicial. A listagem é ordenada por criação decrescente e ID em caso de empate, sem paginação nesta versão.

Verificação local da etapa 5: 151 respostas HTTP no fluxo principal, além de verificações dos limites monetários e rollback. Confirmados preços históricos, totais após alterações, transições, filtros, isolamento, produtos indisponíveis, exclusão lógica e proteção contra duas remoções simultâneas do último item. Uma falha controlada de gravação no banco descartável confirmou rollback integral de pedido, itens e histórico; a restrição temporária foi removida após a verificação. Não houve alteração de migrações ou dependências nem criação de suíte automatizada.

## Entregas

Entregas exigem login de atendente ou entregador. O atendente acessa somente entregas de pedidos que criou; o entregador acessa somente entregas atribuídas a si, inclusive quando atendem pedidos de atendentes diferentes. Filtros não ampliam essa permissão. Recursos alheios, excluídos ou de pedidos excluídos retornam 404. Nenhuma destas rotas é pública.

| Método | Rota | Permissão e resposta |
|---|---|---|
| POST | `/deliveries` | Atendente; corpo `orderId` e `courierId`; 201 com `delivery` |
| GET | `/deliveries` | Ambos; retorna `deliveries`, com filtros opcionais `status` e `courierId` |
| GET | `/deliveries/:deliveryId` | Ambos, conforme vínculo; retorna `delivery` |
| PATCH | `/deliveries/:deliveryId` | Ambos; andamento ou reatribuição permitida; retorna `delivery` |
| DELETE | `/deliveries/:deliveryId` | Atendente; exclusão lógica; retorna 204 |
| POST | `/orders/:orderId/delivery` | Atendente; corpo somente `courierId`; cria entrega para o pedido da URL |
| GET | `/orders/:orderId/delivery` | Ambos, conforme vínculo; consulta entrega do pedido |
| PATCH | `/orders/:orderId/delivery` | Ambos, conforme vínculo; mesmas regras de atualização |
| DELETE | `/orders/:orderId/delivery` | Atendente; mesmas regras de exclusão |

Criação exige pedido próprio em `READY` e usuário ativo com perfil `COURIER`. Usuário inexistente, inativo ou de outro perfil como responsável retorna 409. Cada pedido tem no máximo uma entrega durante seu ciclo, inclusive após exclusão lógica; nova criação para pedido com entrega retorna 409. O backend gera `trackingCode` aleatório e único, registra `assignedAt` e copia os campos de endereço do contato para `addressSnapshot`. Mudanças posteriores no contato não alteram essa cópia. O código é usado pelo rastreamento público, sem autenticação do cliente.

O retorno inclui os campos da entrega, endereço histórico, `orderStatus` e histórico de eventos da entrega, sem carregar contas ou senhas. A listagem exclui registros apagados e é ordenada por criação decrescente e ID em caso de empate, sem paginação. O endereço e as observações internas estão restritos às rotas autenticadas.

Atribuição: PATCH com `{ "courierId": "UUID_DO_ENTREGADOR" }` é exclusivo de atendente e só pode ocorrer em `ASSIGNED`, com pedido `READY`. Ao reatribuir, `assignedAt` é atualizado e o histórico registra a troca; o antigo entregador perde o acesso imediatamente. Não se altera responsável depois da saída. O novo responsável precisa estar ativo. A saída também verifica se o responsável continua ativo; se ele tiver sido desativado antes da saída, o atendente deverá reatribuir a entrega.

Andamento: PATCH com `{ "status": "OUT_FOR_DELIVERY" }`, `{ "status": "DELIVERED" }` ou `{ "status": "FAILED", "failureNote": "Motivo da falha" }` pode ser realizado pelo atendente proprietário ou entregador atribuído. `failureNote` é obrigatório somente em `FAILED`, deve ser texto não vazio com até 1000 caracteres e não é permitido nos demais estados. Altere atribuição ou andamento em chamadas separadas.

| Estado atual | Próximo estado | Situação do pedido |
|---|---|---|
| `ASSIGNED` | `OUT_FOR_DELIVERY` | `IN_DELIVERY` |
| `ASSIGNED` | `FAILED` | `CANCELLED` |
| `OUT_FOR_DELIVERY` | `DELIVERED` | `COMPLETED` |
| `OUT_FOR_DELIVERY` | `FAILED` | `CANCELLED` |

`DELIVERED` e `FAILED` são terminais; não há nova tentativa nesta versão. A conclusão preenche `deliveredAt`; a falha registra motivo e data no evento `FAILED` do histórico, mantendo `deliveredAt` vazio. Repetir o mesmo status não duplica eventos nem muda a data de conclusão; repetir `FAILED` exige manter o motivo já registrado. Transições inválidas retornam 409. As alterações de entrega, pedido e respectivos históricos ocorrem em uma transação, serializada pelo pedido para evitar concorrência com cancelamento ou exclusão.

O entregador não pode criar, excluir ou reatribuir entregas. Campos como `orderId`, endereço, `trackingCode`, datas e proprietário são gerados pelo sistema e rejeitados em atualizações. Tipos inválidos, campos extras, UUID inválido e ausência de motivo em falha retornam 400; operação exclusiva de atendente retorna 403 para entregador.

DELETE em `OUT_FOR_DELIVERY` é bloqueado (409). Antes da saída, DELETE marca a entrega como excluída e `FAILED`, registra motivo de cancelamento e cancela o pedido, preservando o histórico. Em `DELIVERED`/`FAILED`, apenas marca exclusão lógica, preservando o resultado do pedido. Para cancelar um pedido com entrega atribuída antes da saída, exclua a entrega: esse fluxo cancela ambos. O PATCH de pedido não cancela diretamente uma entrega ativa.

Verificação local da etapa 6: 145 respostas HTTP conferidas, incluindo permissões de dois atendentes e dois entregadores, atribuição a usuário inativo, reatribuição e perda de acesso, endereço histórico, filtros, estados e conclusão/falha, exclusão lógica, concorrência de criação 1:1 e conclusão idempotente. Uma falha controlada ao gravar o histórico confirmou rollback integral de entrega, pedido e eventos; a restrição temporária foi removida. Sem novas dependências, migrações ou suíte automatizada. O banco utilizado é descartável e não configura a publicação em nuvem.

## Rastreamento público

O frontend é um projeto separado. Este backend fornece apenas a consulta pública por `trackingCode`, sem cadastro ou autenticação do cliente; não serve páginas, formulários ou assets de interface.

O endpoint público é `GET /public/tracking/:trackingCode`. Use o código UUID v4 da entrega, não o ID interno do pedido ou da entrega. Códigos em maiúsculas também são aceitos. Não há listagem pública, criação ou atualização por essa rota.

```json
{
  "tracking": {
    "trackingCode": "123e4567-e89b-42d3-a456-426614174000",
    "status": "ASSIGNED",
    "createdAt": "2026-11-26T15:00:00.000Z",
    "deliveredAt": null,
    "history": [
      { "status": "ASSIGNED", "changedAt": "2026-11-26T15:00:00.000Z" }
    ]
  }
}
```

A consulta usa uma seleção explícita no banco: retorna somente `trackingCode`, `status`, `createdAt`, `deliveredAt` e `history` com `status`/`changedAt`. Nome, telefone, endereço, produtos, valores, notas internas, motivo detalhado de falha, contas e IDs internos não são consultados nem retornados. O histórico público omite eventos repetidos consecutivos de atribuição; informações internas de reatribuição não aparecem. A situação `FAILED` é apresentada como “Entrega não concluída”, orientando contato com o comércio sem expor a observação interna.

Código malformado retorna 400. Código inexistente, ID interno usado como código, entrega excluída ou pedido excluído retorna 404. Consultas válidas retornam 200. As respostas são marcadas `Cache-Control: no-store`. Rotas operacionais continuam exigindo login.

Há limite de **30 consultas por endereço IP a cada janela de 60 segundos**, incluindo códigos inválidos e inexistentes; a tentativa excedente retorna 429 e `Retry-After` em segundos. Os cabeçalhos `X-RateLimit-Limit` e `X-RateLimit-Remaining` informam o limite e o saldo. A contagem é atômica e compartilhada pelo PostgreSQL, inclusive entre processos e instâncias; não depende de memória local. A tabela técnica `TrackingRateLimit` armazena somente uma chave HMAC do IP, contagem e expiração. A janela, o tempo de espera e a limpeza de registros expirados há mais de um dia usam o relógio do banco. A limpeza acontece na primeira consulta de cada janela ativa.

Na execução local, cabeçalhos de IP enviados pelo cliente são ignorados. Em ambiente Vercel (`VERCEL=1`), é usado o IP válido do `X-Forwarded-For` definido pela plataforma, conforme sua [documentação de cabeçalhos](https://vercel.com/docs/headers/request-headers). IPv4 e sua forma mapeada em IPv6 compartilham a mesma chave. A identificação atrás de outros proxies deve ser adaptada ao ambiente confiável antes de publicar fora da Vercel.

Após atualizar, execute `npm run db:deploy` e `npm run db:generate` para aplicar a migração da tabela técnica e atualizar o cliente. Verificações da etapa 7: consulta sem login, campos permitidos, códigos inválidos/inexistentes, ausência de listagem, exclusão lógica e proteção das rotas internas; 40 consultas concorrentes resultaram em 30 permitidas e 10 bloqueadas; outro processo respeitou a mesma cota; expiração e limpeza foram confirmadas. Nenhuma suíte automatizada foi adicionada. As rotas `/`, `/tracking` e os antigos assets de interface não são disponibilizados e retornam 404 em JSON.

## Referências

- [Escopo](docs/Escopo.md)
- [Plano e verificação por etapa](docs/Plano.md)
- [Instruções de desenvolvimento](Skills/AGENTS.md)

## Equipe e publicação

Nomes e RAs dos integrantes, URL da Vercel e links de entrega: pendentes de preenchimento pela equipe.
