# Recife Express — definição do projeto e escopo

## O que é o projeto?

**Recife Express** é uma API REST para apoiar pequenos comércios na organização de pedidos e entregas locais. O sistema permitirá que funcionários registrem pedidos, associem produtos, atribuam uma entrega a um entregador e acompanhem a situação até a conclusão.

O projeto será desenvolvido como atividade acadêmica, com foco em backend, persistência relacional, regras de negócio e uma página web pública de rastreamento e integração futura com um aplicativo. A aplicação mobile em React Native é uma iniciativa separada e **não faz parte do escopo deste repositório**; ela poderá consumir a API quando estiver disponível.

### Escopo da primeira versão

- Um único pequeno comércio por instalação da aplicação.
- Pedidos registrados por atendentes; o cliente não terá cadastro nem autenticação e poderá consultar o pacote pelo código de rastreamento.
- Entregas locais com endereço informado manualmente.
- Um entregador responsável por entrega.
- Atualização manual dos estados do pedido e da entrega.
- Sem integração com mapas, GPS, pagamentos, WhatsApp, e-mail ou serviços externos.
- Sem testes automatizados, conforme definido para a atividade.

## Quem é o usuário

O sistema terá dois perfis de acesso autenticado, com múltiplas contas possíveis em cada perfil:

| Perfil | Responsabilidades principais |
|---|---|
| **Atendente (`ATTENDANT`)** | Gerencia seus contatos de destinatários, produtos, pedidos e entregas; atribui entregadores aos seus pedidos. |
| **Entregador (`COURIER`)** | Consulta somente as entregas atribuídas a si e atualiza seu andamento. |

O **cliente** não é um usuário autenticado. Ele acessa uma página pública, informa o ID público do pacote e visualiza os detalhes públicos e o acompanhamento da entrega. O atendente informa os dados necessários do destinatário ao registrar o pedido; isso não cria uma conta para o cliente.

### Acesso por tipo de usuário

O login será realizado por atendentes e entregadores. As rotas operacionais exigem autenticação e autorização conforme o perfil e a propriedade dos dados. O cliente não possui conta e acessa somente a página pública de rastreamento e seu endpoint de consulta por código do pacote. A documentação Swagger e seu esquema também exigirão login.

## Entidades

A proposta usa sete entidades principais. O mínimo obrigatório é CRUD completo de quatro entidades e operações sobre pelo menos dois relacionamentos, acessíveis por URLs compostas.

| Entidade | Responsabilidade | Campos principais sugeridos |
|---|---|---|
| `User` | Conta de um atendente ou entregador. | `id`, `name`, `email`, `passwordHash`, `role`, `active` |
| `Customer` | Contato do destinatário informado pelo atendente, sem conta de acesso. | `id`, `createdById`, `name`, `phone`, `street`, `number`, `complement`, `neighborhood`, `city`, `reference` |
| `Product` | Produto oferecido pelo comércio. | `id`, `createdById`, `name`, `description`, `price`, `active` |
| `Order` | Pedido registrado pelo atendente. | `id`, `customerId`, `createdById`, `status`, `notes`, `createdAt` |
| `OrderItem` | Produto, quantidade e preço aplicado em um pedido. | `id`, `orderId`, `productId`, `quantity`, `unitPrice` |
| `Delivery` | Dados da entrega associada ao pedido. | `id`, `trackingCode`, `orderId`, `courierId`, `addressSnapshot`, `status`, `assignedAt`, `deliveredAt` |
| `StatusHistory` | Registro das mudanças de situação do pedido ou entrega. | `id`, `orderId`, `changedById`, `status`, `note`, `changedAt` |

### Relacionamentos e cardinalidades

- Um `Customer` pode ter vários `Order`; cada `Order` pertence a um cliente (**1:N**).
- Um `Order` pode conter vários `Product`, e um `Product` pode aparecer em vários pedidos. Essa relação **N:N** é implementada por `OrderItem`, que também guarda quantidade e preço unitário no momento da venda.
- Cada `Order` terá no máximo uma `Delivery` nesta versão; cada `Delivery` pertence a um único pedido (**1:1**).
- Um `User` com perfil de entregador pode receber várias `Delivery`; cada entrega tem no máximo um entregador responsável (**1:N**).
- Um `Order` pode ter vários registros de `StatusHistory` (**1:N**).

`unitPrice` deve ser copiado para `OrderItem` no momento da criação do pedido. Assim, uma alteração futura no preço do produto não muda o valor histórico do pedido. O endereço da entrega também deve ser armazenado como uma cópia dos dados usados naquele pedido, evitando mudanças caso o endereço do cliente seja atualizado depois.

## Requisitos Funcionais

### Usuários e acesso

- **RF01.** Permitir sign up, login e logout de atendentes e entregadores.
- **RF02.** Permitir que cada usuário consulte, atualize e desative sua própria conta, sem alterar seu perfil pelo endpoint de atualização.
- **RF03.** Restringir operações de acordo com o perfil do usuário autenticado.

### Clientes e produtos

- **RF04.** Permitir que atendentes cadastrem, consultem, atualizem e excluam seus contatos de destinatários, sem criar credenciais para clientes.
- **RF05.** Permitir que atendentes cadastrem, consultem, atualizem e excluam seus produtos.
- **RF06.** Não permitir a inclusão de produto inativo em um novo pedido.

### Pedidos

- **RF07.** Permitir registrar um pedido para um cliente, incluindo um ou mais produtos, quantidades e observações.
- **RF08.** Calcular o total do pedido a partir dos itens registrados no backend.
- **RF09.** Permitir consultar os próprios pedidos individualmente e listar pedidos com filtros simples por situação e período.
- **RF10.** Permitir atualizar a situação do pedido segundo as transições previstas no sistema.
- **RF11.** Registrar quem criou o pedido e manter histórico das mudanças de situação.

### Entregas

- **RF12.** Permitir criar uma entrega para um pedido e atribuí-la a um usuário ativo com perfil de entregador.
- **RF13.** Permitir que o entregador consulte somente as entregas atribuídas a ele.
- **RF14.** Permitir atualizar a situação da entrega para `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED` ou `FAILED`.
- **RF15.** Registrar data e hora da conclusão e observação quando a entrega não for concluída.
- **RF16.** Permitir que atendentes consultem as entregas de seus pedidos por situação e entregador.

### Situações sugeridas

- Pedido: `RECEIVED`, `PREPARING`, `READY`, `IN_DELIVERY`, `COMPLETED`, `CANCELLED`.
- Entrega: `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`.

As mudanças devem ser validadas no serviço. Por exemplo, um pedido cancelado não pode ser enviado para entrega; uma entrega só pode ser concluída depois de sair para entrega. O sistema deve registrar o histórico de cada alteração aceita.

### Rastreamento público e documentação

- **RF17.** Disponibilizar uma página web pública com formulário para inserir o ID público do pacote (`trackingCode`) e exibir os detalhes públicos, a situação atual e o histórico de acompanhamento da entrega.
- **RF18.** Oferecer `GET /public/tracking/:trackingCode` sem autenticação, exclusivamente para consulta de um pacote. Não disponibilizar listagem pública.
- **RF19.** Usar código de rastreamento único, aleatório e não sequencial. Retornar somente código, situação, datas e eventos públicos; não expor nome, telefone, endereço completo, observações internas, contas ou identificadores internos. Aplicar limitação de requisições à consulta pública.
- **RF20.** Implementar documentação OpenAPI com Swagger UI, cobrindo autenticação, entidades, relacionamentos, rastreamento público, exemplos, erros e esquema Bearer. Disponibilizar `/api-docs` e o esquema OpenAPI com acesso autenticado, inclusive os recursos necessários à interface.
- **RF21.** Implementar CRUD completo de `Customer`, `Product`, `Order` e `Delivery`, com criação, listagem, consulta individual, atualização e exclusão. Exclusões devem respeitar vínculos e histórico: usar exclusão lógica quando necessário e documentar esse comportamento no Swagger e no Postman.

### Rotas compostas e relacionamentos

As rotas abaixo são autenticadas e verificam o acesso ao recurso pai antes de acessar o filho:

| Relacionamento | Rotas previstas |
|---|---|
| Cliente → pedidos (1:N) | `GET /customers/:customerId/orders`, `POST /customers/:customerId/orders` |
| Pedido → produtos via itens (N:N) | `GET /orders/:orderId/items`, `POST /orders/:orderId/items`, `GET /orders/:orderId/items/:itemId`, `PATCH /orders/:orderId/items/:itemId`, `DELETE /orders/:orderId/items/:itemId` |
| Pedido → entrega (1:1) | `GET /orders/:orderId/delivery`, `POST /orders/:orderId/delivery`, `PATCH /orders/:orderId/delivery`, `DELETE /orders/:orderId/delivery` |

Um item deve pertencer ao pedido indicado na URL. O atendente só pode vincular contatos e produtos próprios. Itens só podem ser alterados enquanto o pedido permitir edição; alterações recalculam o total no backend. O entregador não recebe permissão para gerenciar itens ou excluir entregas.

## Autenticação e autorização

A API usará middleware Express, JWT e sessões revogáveis persistidas no PostgreSQL:

1. `POST /auth/signup`: cadastro público de contas internas com perfil `ATTENDANT` ou `COURIER`; validar os campos e rejeitar qualquer outro perfil. Esse cadastro atende ao sign up exigido pela disciplina, sem cadastrar clientes.
2. `POST /auth/login`: validar e-mail e senha e emitir JWT com expiração e identificador de sessão.
3. As chamadas protegidas enviam `Authorization: Bearer <token>`; o middleware verifica validade, expiração, conta ativa e sessão não revogada.
4. `POST /auth/logout`: revogar a sessão atual no banco para impedir reutilização do token, inclusive em outra instância da aplicação.
5. Cada usuário só altera sua própria conta. O atendente só gerencia os registros que criou e as entregas vinculadas aos seus pedidos. O entregador só acessa entregas atribuídas a ele e altera os campos de andamento permitidos; não pode reatribuir entregas, mudar o pedido ou editar contas alheias.

As senhas serão armazenadas como hash usando `bcryptjs`, nunca em texto puro. A entidade técnica de sessão terá usuário, identificador único, expiração e data de revogação. Não haverá recuperação automática de senha na primeira versão.

## Stack (Ferramentas de desenvolvimento)

| Camada / finalidade | Tecnologia proposta |
|---|---|
| Runtime e linguagem | Node.js (JavaScript) |
| Framework backend | Express |
| API | Express (REST/JSON) |
| Persistência | Prisma ORM |
| Banco relacional | PostgreSQL |
| Autenticação e autorização | Middleware Express + JWT + sessões revogáveis no PostgreSQL |
| Hash de senhas | bcryptjs |
| Validação de entrada | express-validator |
| Documentação da API | OpenAPI / Swagger UI (implementação obrigatória) |
| Gerenciamento de dependências | npm |
| Controle de versão | Git e GitHub |
| Cliente futuro da API | React Native, fora do escopo deste projeto |

As versões exatas das dependências devem ser registradas no `package.json` e no `package-lock.json` para que todos os integrantes usem a mesma configuração.

## Arquitetura (package by layer, convenções, etc.)

O backend seguirá uma arquitetura simples, organizada por responsabilidade em módulos JavaScript. A lógica de negócio fica nos serviços, e os controladores cuidam apenas da comunicação HTTP.

```text
src/
├── config/          # configuração geral e conexão com o banco
├── controllers/     # tratamento HTTP dos endpoints
├── middlewares/     # autenticação, autorização e tratamento de erros
├── routes/          # definição e agrupamento das rotas
├── services/        # regras de negócio
├── validators/      # validação dos dados de entrada
└── app.js           # configuração e inicialização do Express
prisma/
└── schema.prisma    # modelos relacionais e configuração do Prisma
```

### Convenções

- Usar módulos ES (`import`/`export`) e nomes em `camelCase` para variáveis e funções; nomes de modelos e classes podem usar `PascalCase` quando apropriado.
- Separar rotas, controladores, serviços e acesso a dados, sem introduzir camadas extras sem necessidade.
- Validar os dados recebidos com `express-validator` antes de executar as regras de negócio.
- Manter regras como cálculo do total e transições de status nos serviços.
- Retornar códigos HTTP e respostas JSON adequados e consistentes.
- Centralizar o tratamento de erros em middleware Express.
- Usar transações do Prisma nos casos de uso que salvam pedido e itens em conjunto.
- Manter configurações e credenciais fora do código, usando variáveis de ambiente.
- Não criar camadas ou padrões adicionais sem necessidade para os requisitos do projeto.

## Publicação e entrega acadêmica

- Publicar a aplicação Express na **Vercel**, com URL acessível para avaliação e página pública de rastreamento. Adaptar a inicialização ao ambiente de hospedagem e persistir dados e sessões no PostgreSQL, sem depender da memória de uma instância.
- Usar **PostgreSQL na nuvem**, como Neon ou outro provedor que permaneça disponível durante o semestre. Confirmar a disponibilidade do banco até o fim da avaliação.
- Configurar `DATABASE_URL`, `JWT_SECRET` e demais credenciais por variáveis de ambiente, sem versionar segredos. Fornecer `.env.example` somente com nomes e valores fictícios.
- Versionar migrações Prisma e disponibilizar comando de seed repetível, com pelo menos **dois registros por entidade e duas ocorrências por relacionamento**. Incluir duas contas de cada perfil para demonstrar bloqueio de acesso entre usuários; os dados devem ser fictícios e as senhas fornecidas por configuração local.
- Manter no GitHub um `README.md` com descrição, instalação, variáveis de ambiente, migrações, seed, execução, autenticação, rastreamento público, links de publicação e **nome e RA de todos os integrantes**.
- Entregar coleção **Postman** e ambiente com variáveis como `baseUrl`, tokens de cada perfil, IDs das entidades e `trackingCode`, sem credenciais reais ou tokens ativos exportados. Cobrir sign up, login, logout, CRUD, URLs compostas, consulta pública e tentativas de acesso indevido. Demonstrar que o token deixa de funcionar após logout.
- Entregar link de vídeo com áudio no **YouTube**, público ou não listado, com duração máxima de **3 minutos**, mostrando comandos no Postman para entidades e relacionamentos e alteração das variáveis.
- Entregar apresentação em **PDF**, com requisitos implementados e não implementados e descrição do que **cada integrante implementou**. Os artefatos serão preparados quando houver implementação para demonstrar; este documento não declara funcionalidades concluídas.
- Apresentação em aula em **30/11/2026 ou 03/12/2026**, com data sorteada. A equipe que não apresentar recebe penalidade de 1,0 ponto; integrante que não participar também recebe penalidade de 1,0 ponto.
- **Todos os integrantes devem entregar pelo Teams**; a falta de entrega individual implica penalidade de 1,0 ponto. Todos devem participar do desenvolvimento, com participação evidenciada pelos commits no GitHub.

### Critérios de conclusão

A entrega deve demonstrar Express com PostgreSQL, Swagger funcional, sign up/login/logout, dois perfis autenticados, isolamento de dados por usuário, CRUD das quatro entidades definidas, dois ou mais relacionamentos por URLs compostas, seed mínimo e rastreamento público sem cadastro do cliente. O login é obrigatório para atendentes e entregadores; o cliente consulta o rastreamento sem cadastro ou autenticação. A verificação será manual via Swagger e Postman, sem testes automatizados nesta versão.
