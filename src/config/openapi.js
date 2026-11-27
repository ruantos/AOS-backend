const ref = name => ({ $ref: `#/components/schemas/${name}` });
const uuid = { type: 'string', format: 'uuid', example: '123e4567-e89b-42d3-a456-426614174000' };
const date = { type: 'string', format: 'date-time', example: '2026-11-26T15:00:00.000Z' };
const nullableDate = { ...date, nullable: true };
const money = { type: 'string', pattern: '^\\d+\\.\\d{2}$', example: '10.35', description: 'Valor decimal com duas casas, retornado como texto.' };
const text = (maxLength, nullable = false, minLength = 0) => ({ type: 'string', maxLength, minLength, ...(nullable ? { nullable: true } : {}) });
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const array = items => ({ type: 'array', items });
const envelope = (key, schema) => object({ [key]: schema });
const patch = properties => ({ ...object(properties, []), minProperties: 1 });
const quantity = { type: 'integer', minimum: 1, maximum: 10000, example: 2 };
const notes = text(1000, true);
const customerProperties = {
  name: { ...text(120, false, 2), example: 'Destinatário fictício' },
  phone: { ...text(30, false, 1), example: '(81) 00000-0000' },
  street: { ...text(200, false, 1), example: 'Rua de exemplo' },
  number: { ...text(30, false, 1), example: '10' },
  complement: text(200, true),
  neighborhood: { ...text(120, false, 1), example: 'Centro' },
  city: { ...text(120, false, 1), example: 'Recife' },
  reference: text(300, true),
};
const customerRequired = ['name', 'phone', 'street', 'number', 'neighborhood', 'city'];
const priceInput = {
  oneOf: [
    { type: 'string', pattern: '^(0|[1-9]\\d{0,9})(\\.\\d{1,2})?$', example: '10.35' },
    { type: 'number', minimum: 0, maximum: 9999999999.99, multipleOf: 0.01, example: 10.35 },
  ],
  description: 'Preço não negativo, até 10 dígitos inteiros e 2 decimais. Prefira texto para preservar precisão. Texto sem espaços, sinal ou notação exponencial.',
};
const productProperties = { name: { ...text(120, false, 2), example: 'Produto de exemplo' }, description: text(1000, true), price: priceInput, active: { type: 'boolean', default: true } };
const password = { type: 'string', minLength: 8, format: 'password', writeOnly: true, description: 'Entre 8 caracteres e 72 bytes UTF-8. Sem truncamento ou remoção de espaços.', example: 'SENHA_DE_EXEMPLO' };
const userProperties = { name: { ...text(120, false, 2), example: 'Atendente de exemplo' }, email: { type: 'string', format: 'email', maxLength: 254, example: 'atendente@example.com' }, password };
const timestamps = { createdAt: date, updatedAt: date };
const orderStatuses = ['RECEIVED', 'PREPARING', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED'];
const deliveryStatuses = ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'];
const initialItems = { type: 'array', minItems: 1, maxItems: 100, items: ref('ItemInput'), description: 'Produtos distintos, próprios, ativos e não excluídos. IDs repetidos são rejeitados.' };
const schemas = {
  Role: { type: 'string', enum: ['ATTENDANT', 'COURIER'] },
  OrderStatus: { type: 'string', enum: orderStatuses },
  DeliveryStatus: { type: 'string', enum: deliveryStatuses },
  Error: object({ error: object({ code: { type: 'string', example: 'VALIDATION_ERROR' }, message: { type: 'string', example: 'Dados inválidos.' }, details: array(object({ field: { type: 'string', example: 'name' }, message: { type: 'string', example: 'Campo deve ser texto.' } })) }, ['code', 'message']) }),
  User: object({ id: uuid, name: userProperties.name, email: userProperties.email, role: ref('Role'), active: { type: 'boolean' }, ...timestamps }),
  SignupInput: object({ ...userProperties, role: ref('Role') }),
  LoginInput: object({ email: userProperties.email, password }),
  UserPatch: patch(userProperties),
  UserResponse: envelope('user', ref('User')),
  LoginResponse: object({ accessToken: { type: 'string', example: 'JWT_RETORNADO_NO_LOGIN' }, tokenType: { type: 'string', enum: ['Bearer'] }, expiresAt: date, user: ref('User') }),
  CustomerInput: object(customerProperties, customerRequired),
  CustomerPatch: patch(customerProperties),
  Customer: object({ id: uuid, createdById: uuid, ...customerProperties, deletedAt: nullableDate, ...timestamps }),
  CustomerResponse: envelope('customer', ref('Customer')),
  CustomersResponse: envelope('customers', array(ref('Customer'))),
  ProductInput: object(productProperties, ['name', 'price']),
  ProductPatch: patch(productProperties),
  Product: object({ id: uuid, createdById: uuid, ...productProperties, description: text(1000, true), price: money, active: { type: 'boolean' }, deletedAt: nullableDate, ...timestamps }),
  ProductResponse: envelope('product', ref('Product')),
  ProductsResponse: envelope('products', array(ref('Product'))),
  ItemInput: object({ productId: uuid, quantity }),
  ItemPatch: object({ quantity }),
  OrderItem: object({ id: uuid, orderId: uuid, productId: uuid, quantity, unitPrice: money, subtotal: money }),
  ItemResponse: envelope('item', ref('OrderItem')),
  ItemsResponse: envelope('items', array(ref('OrderItem'))),
  ItemMutationResponse: object({ item: ref('OrderItem'), total: money }),
  StatusHistory: object({ id: uuid, orderId: uuid, deliveryId: { ...uuid, nullable: true }, changedById: uuid, orderStatus: { type: 'string', enum: [...orderStatuses, null], nullable: true }, deliveryStatus: { type: 'string', enum: [...deliveryStatuses, null], nullable: true }, note: notes, changedAt: date }),
  OrderInput: object({ customerId: uuid, notes, items: initialItems }, ['customerId', 'items']),
  CustomerOrderInput: object({ notes, items: initialItems }, ['items']),
  OrderPatch: patch({ notes, status: { allOf: [ref('OrderStatus')], description: 'Fluxo manual RECEIVED → PREPARING → READY, ou cancelamento desses estados sem entrega vinculada. IN_DELIVERY/COMPLETED são controlados pela entrega.' } }),
  Order: object({ id: uuid, customerId: uuid, createdById: uuid, status: ref('OrderStatus'), notes, deletedAt: nullableDate, ...timestamps, items: array(ref('OrderItem')), history: array(ref('StatusHistory')), total: money }),
  OrderResponse: envelope('order', ref('Order')),
  OrdersResponse: envelope('orders', array(ref('Order'))),
  AddressSnapshot: object({ street: customerProperties.street, number: customerProperties.number, complement: customerProperties.complement, neighborhood: customerProperties.neighborhood, city: customerProperties.city, reference: customerProperties.reference }),
  DeliveryInput: object({ orderId: uuid, courierId: uuid }),
  OrderDeliveryInput: object({ courierId: uuid }),
  DeliveryPatch: {
    oneOf: [
      object({ courierId: uuid }),
      object({ status: { type: 'string', enum: ['ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'] } }),
      object({ status: { type: 'string', enum: ['FAILED'] }, failureNote: text(1000, false, 1) }),
    ],
    description: 'Reatribuição exclusiva do atendente antes da saída. Andamento pelo atendente proprietário ou entregador atribuído. Falha exige motivo não vazio; não combine courierId com status.',
  },
  Delivery: object({ id: uuid, trackingCode: uuid, orderId: uuid, courierId: { ...uuid, nullable: true }, addressSnapshot: ref('AddressSnapshot'), status: ref('DeliveryStatus'), assignedAt: nullableDate, deliveredAt: nullableDate, failureNote: notes, deletedAt: nullableDate, ...timestamps, history: array(ref('StatusHistory')), orderStatus: ref('OrderStatus') }),
  DeliveryResponse: envelope('delivery', ref('Delivery')),
  DeliveriesResponse: envelope('deliveries', array(ref('Delivery'))),
  Tracking: object({ trackingCode: uuid, status: ref('DeliveryStatus'), createdAt: date, deliveredAt: nullableDate, history: array(object({ status: ref('DeliveryStatus'), changedAt: date })) }),
  TrackingResponse: envelope('tracking', ref('Tracking')),
};

const errors = {
  400: ['BadRequest', 'Corpo, UUID, filtros ou campos inválidos. Campos extras são rejeitados.'],
  401: ['Unauthorized', 'Credenciais inválidas, sessão ausente, expirada ou revogada, ou conta inativa.'],
  403: ['Forbidden', 'Perfil sem permissão para esta operação.'],
  404: ['NotFound', 'Recurso inexistente, excluído, alheio ou não pertencente ao pai informado.'],
  409: ['Conflict', 'Violação de unicidade ou regra de negócio, produto inativo ou transição inválida.'],
  413: ['PayloadTooLarge', 'JSON excede o limite de 100 KB.'],
  429: ['TooManyRequests', 'Mais de 30 consultas de rastreamento por IP na janela de 60 segundos.'],
  500: ['InternalError', 'Erro interno; detalhes não são expostos.'],
};
const responseRef = status => ({ $ref: `#/components/responses/${errors[status][0]}` });
const parameter = name => ({ name, in: 'path', required: true, schema: uuid, description: name === 'trackingCode' ? 'Código público UUID v4. Não é o ID interno de pedido ou entrega.' : 'Identificador UUID do recurso.' });
const query = (name, schema, description) => ({ name, in: 'query', required: false, schema, description });
const orderFilters = [query('status', ref('OrderStatus'), 'Situação do pedido.'), query('from', date, 'Limite inicial inclusivo de createdAt; timestamp com fuso.'), query('to', date, 'Limite final inclusivo de createdAt; não pode ser anterior a from.')];
const deliveryFilters = [query('status', ref('DeliveryStatus'), 'Situação da entrega.'), query('courierId', uuid, 'Filtra pelo responsável sem ampliar a permissão do usuário.')];

function operation(id, tag, summary, { response, code = 200, body, params = [], description = '', publicAccess = false, roles = ['ATTENDANT'], extraErrors = [], example, examples } = {}) {
  const responses = { [code]: code === 204 ? { description: 'Operação concluída, sem corpo.' } : { description: 'Operação concluída.', content: { 'application/json': { schema: ref(response) } } } };
  for (const status of new Set([500, ...(publicAccess ? [] : [401, 403]), ...(body || params.length ? [400] : []), ...(body ? [413] : []), ...extraErrors])) responses[status] = responseRef(status);
  return {
    operationId: id, tags: [tag], summary,
    description: `${publicAccess ? 'Acesso público, sem autenticação.' : `Perfis: ${roles.join(', ')}. `}${description}`,
    ...(publicAccess ? { security: [] } : {}),
    ...(params.length ? { parameters: params } : {}),
    ...(body ? { requestBody: { required: true, content: { 'application/json': { schema: ref(body), ...(example ? { example } : {}), ...(examples ? { examples } : {}) } } } } : {}),
    responses,
  };
}

const paths = {
  '/auth/signup': { post: operation('signup', 'Autenticação', 'Cadastrar atendente ou entregador', { publicAccess: true, body: 'SignupInput', code: 201, response: 'UserResponse', extraErrors: [409], description: 'Cadastro não autentica automaticamente. E-mail é normalizado em minúsculas. Clientes não possuem conta.', example: { name: 'Atendente de exemplo', email: 'atendente@example.com', password: 'SENHA_DE_EXEMPLO', role: 'ATTENDANT' } }) },
  '/auth/login': { post: operation('login', 'Autenticação', 'Autenticar usuário interno', { publicAccess: true, body: 'LoginInput', response: 'LoginResponse', extraErrors: [401], description: 'Retorna JWT Bearer e cria sessão revogável no PostgreSQL. Também define cookie HttpOnly limitado a /api-docs para abrir a documentação no navegador; não autentica operações da API por cookie.', example: { email: 'atendente@example.com', password: 'SENHA_DE_EXEMPLO' } }) },
  '/auth/logout': { post: operation('logout', 'Autenticação', 'Revogar sessão atual', { code: 204, roles: ['ATTENDANT', 'COURIER'], description: 'Invalida o token no servidor e remove o cookie da documentação. Outras sessões permanecem válidas.' }) },
  '/users/me': {
    get: operation('getMe', 'Conta', 'Consultar própria conta', { response: 'UserResponse', roles: ['ATTENDANT', 'COURIER'] }),
    patch: operation('updateMe', 'Conta', 'Atualizar própria conta', { body: 'UserPatch', response: 'UserResponse', roles: ['ATTENDANT', 'COURIER'], extraErrors: [409], description: 'Somente nome, e-mail e senha. Alterar senha revoga todas as sessões, inclusive a atual. Não permite mudar perfil, ID ou active.', example: { name: 'Nome atualizado' } }),
    delete: operation('deactivateMe', 'Conta', 'Desativar própria conta', { code: 204, roles: ['ATTENDANT', 'COURIER'], description: 'Desativa a conta e revoga todas as sessões. Preserva e-mail único e vínculos históricos; sem reativação pública.' }),
  },
};

for (const [path, tag, entity, singular, plural, idName] of [
  ['/customers', 'Contatos', 'Customer', 'contato', 'contatos', 'id'],
  ['/products', 'Produtos', 'Product', 'produto', 'produtos', 'id'],
]) {
  const description = 'Somente registros próprios não excluídos. Listagem sem paginação, ordenada por criação decrescente e ID em caso de empate. ';
  paths[path] = {
    get: operation(`list${entity}s`, tag, `Listar ${plural}`, { response: `${entity}sResponse`, description }),
    post: operation(`create${entity}`, tag, `Cadastrar ${singular}`, { body: `${entity}Input`, code: 201, response: `${entity}Response`, description: `${description}Proprietário definido pelo token.`, example: entity === 'Customer' ? { name: 'Destinatário fictício', phone: '(81) 00000-0000', street: 'Rua de exemplo', number: '10', neighborhood: 'Centro', city: 'Recife' } : { name: 'Produto de exemplo', price: '10.35', active: true } }),
  };
  paths[`${path}/{${idName}}`] = {
    get: operation(`get${entity}`, tag, `Consultar ${singular}`, { response: `${entity}Response`, params: [parameter(idName)], extraErrors: [404], description }),
    patch: operation(`update${entity}`, tag, `Atualizar ${singular}`, { body: `${entity}Patch`, response: `${entity}Response`, params: [parameter(idName)], extraErrors: [404], description: `${description}Campos opcionais de texto aceitam null para limpeza.`, example: entity === 'Customer' ? { city: 'Olinda' } : { price: '12.50', active: false } }),
    delete: operation(`delete${entity}`, tag, `Excluir ${singular} logicamente`, { code: 204, params: [parameter(idName)], extraErrors: [404], description: `Marca deletedAt sem apagar vínculos. ${entity === 'Product' ? 'Também define active=false; produtos apenas inativos podem ser reativados por PATCH, excluídos não.' : 'Pedidos existentes permanecem disponíveis por /orders.'} Repetir a exclusão retorna 404.` }),
  };
}

paths['/orders'] = {
  get: operation('listOrders', 'Pedidos', 'Listar próprios pedidos', { response: 'OrdersResponse', params: orderFilters, description: 'Filtros por situação e período de criação. Sem paginação; criação decrescente e ID em caso de empate.' }),
  post: operation('createOrder', 'Pedidos', 'Criar pedido com itens', { body: 'OrderInput', code: 201, response: 'OrderResponse', extraErrors: [404, 409], description: 'Contato e produtos próprios não excluídos; produtos ativos. De 1 a 100 produtos distintos, quantidade inteira até 10000. Copia preço vigente, calcula total em decimal e registra RECEIVED. Pedido, itens e histórico são gravados em transação.', example: { customerId: uuid.example, notes: 'Observação opcional', items: [{ productId: '223e4567-e89b-42d3-a456-426614174000', quantity: 2 }] } }),
};
paths['/orders/{orderId}'] = {
  get: operation('getOrder', 'Pedidos', 'Consultar pedido com itens, total e histórico', { response: 'OrderResponse', params: [parameter('orderId')], extraErrors: [404] }),
  patch: operation('updateOrder', 'Pedidos', 'Atualizar observações ou situação do pedido', { body: 'OrderPatch', response: 'OrderResponse', params: [parameter('orderId')], extraErrors: [404, 409], description: 'Notas editáveis somente em RECEIVED/PREPARING. RECEIVED → PREPARING → READY; cancelamento nesses estados sem entrega não excluída. Repetir estado não duplica histórico. Entrega controla IN_DELIVERY/COMPLETED; transições e histórico são transacionais.', example: { status: 'PREPARING' } }),
  delete: operation('deleteOrder', 'Pedidos', 'Excluir pedido logicamente', { code: 204, params: [parameter('orderId')], extraErrors: [404, 409], description: 'Preserva itens/histórico. Cancela pedido não concluído, registrando evento se necessário; preserva COMPLETED. Bloqueia pedido em entrega ou com entrega ativa ASSIGNED/OUT_FOR_DELIVERY. Entrega terminal não impede exclusão lógica do pedido.' }),
};
paths['/customers/{customerId}/orders'] = {
  get: operation('listCustomerOrders', 'Relacionamentos', 'Listar pedidos do contato', { response: 'OrdersResponse', params: [parameter('customerId'), ...orderFilters], extraErrors: [404], description: 'Valida contato pai próprio e não excluído; retorna somente seus pedidos próprios não excluídos.' }),
  post: operation('createCustomerOrder', 'Relacionamentos', 'Criar pedido para o contato da URL', { body: 'CustomerOrderInput', code: 201, response: 'OrderResponse', params: [parameter('customerId')], extraErrors: [404, 409], description: 'Mesmas regras de POST /orders. customerId vem exclusivamente da URL; não o envie no corpo.', example: { items: [{ productId: uuid.example, quantity: 2 }] } }),
};
paths['/orders/{orderId}/items'] = {
  get: operation('listItems', 'Relacionamentos', 'Listar itens do pedido', { response: 'ItemsResponse', params: [parameter('orderId')], extraErrors: [404] }),
  post: operation('addItem', 'Relacionamentos', 'Adicionar produto ao pedido', { body: 'ItemInput', code: 201, response: 'ItemMutationResponse', params: [parameter('orderId')], extraErrors: [404, 409], description: 'Somente em RECEIVED/PREPARING, até 100 itens distintos. Produto próprio, ativo e não excluído. Copia preço atual e recalcula total; produto já incluído retorna 409.', example: { productId: uuid.example, quantity: 2 } }),
};
paths['/orders/{orderId}/items/{itemId}'] = {
  get: operation('getItem', 'Relacionamentos', 'Consultar item pertencente ao pedido', { response: 'ItemResponse', params: [parameter('orderId'), parameter('itemId')], extraErrors: [404] }),
  patch: operation('updateItem', 'Relacionamentos', 'Alterar quantidade do item', { body: 'ItemPatch', response: 'ItemMutationResponse', params: [parameter('orderId'), parameter('itemId')], extraErrors: [404, 409], description: 'Somente em RECEIVED/PREPARING e produto ativo/não excluído. Preserva preço histórico. Não altera productId, orderId ou unitPrice; recalcula total.', example: { quantity: 3 } }),
  delete: operation('deleteItem', 'Relacionamentos', 'Remover item do pedido', { code: 204, params: [parameter('orderId'), parameter('itemId')], extraErrors: [404, 409], description: 'Somente em RECEIVED/PREPARING. Exclui o item e recalcula total a partir dos restantes. Não permite remover o último item, inclusive com chamadas concorrentes (409).' }),
};

const deliveryDescription = 'Atendente: somente pedidos próprios; entregador: somente entregas atribuídas a si. Pedido/entrega excluídos retornam 404. ';
const deliveryUpdateDescription = `${deliveryDescription}Atendente reatribui apenas em ASSIGNED e pedido READY. Andamento: ASSIGNED → OUT_FOR_DELIVERY → DELIVERED ou FAILED; ASSIGNED também permite FAILED. Saída exige responsável ativo e marca pedido IN_DELIVERY; conclusão preenche deliveredAt e marca COMPLETED; falha exige failureNote e marca CANCELLED. Data/motivo da falha ficam no histórico. Estados terminais sem nova tentativa. Mesmo status é idempotente; em FAILED o motivo precisa ser o já registrado. Entrega, pedido e eventos atualizados em uma transação.`;
const deliveryDeleteDescription = 'Somente atendente proprietário. Exclusão lógica; bloqueada em OUT_FOR_DELIVERY. Em ASSIGNED, registra FAILED com motivo de cancelamento e cancela o pedido. Em estados terminais, preserva resultado do pedido e histórico. Vínculo 1:1 continua reservado após exclusão.';
const deliveryExamples = { outgoing: { summary: 'Sair para entrega', value: { status: 'OUT_FOR_DELIVERY' } }, completed: { summary: 'Concluir entrega', value: { status: 'DELIVERED' } }, failed: { summary: 'Registrar falha', value: { status: 'FAILED', failureNote: 'Destinatário ausente.' } }, reassign: { summary: 'Reatribuir antes da saída (atendente)', value: { courierId: uuid.example } } };
paths['/deliveries'] = {
  get: operation('listDeliveries', 'Entregas', 'Listar entregas permitidas ao usuário', { response: 'DeliveriesResponse', params: deliveryFilters, roles: ['ATTENDANT', 'COURIER'], description: `${deliveryDescription}Filtros não ampliam o acesso. Sem paginação; criação decrescente e ID em caso de empate.` }),
  post: operation('createDelivery', 'Entregas', 'Criar entrega e atribuir entregador', { body: 'DeliveryInput', code: 201, response: 'DeliveryResponse', extraErrors: [404, 409], description: 'Exige pedido próprio READY e entregador ativo. Uma entrega por pedido, inclusive após exclusão. Gera código aleatório e copia endereço atual do contato; mudanças posteriores não alteram o snapshot. Registra ASSIGNED e assignedAt.', example: { orderId: uuid.example, courierId: '323e4567-e89b-42d3-a456-426614174000' } }),
};
for (const [path, paramName, nested] of [['/deliveries/{deliveryId}', 'deliveryId', false], ['/orders/{orderId}/delivery', 'orderId', true]]) {
  paths[path] = {
    ...(nested ? { post: operation('createOrderDelivery', 'Relacionamentos', 'Criar entrega do pedido da URL', { body: 'OrderDeliveryInput', code: 201, response: 'DeliveryResponse', params: [parameter(paramName)], extraErrors: [404, 409], description: 'Mesmas regras de POST /deliveries. orderId vem da URL; corpo contém somente courierId.', example: { courierId: uuid.example } }) } : {}),
    get: operation(nested ? 'getOrderDelivery' : 'getDelivery', nested ? 'Relacionamentos' : 'Entregas', 'Consultar entrega', { response: 'DeliveryResponse', params: [parameter(paramName)], roles: ['ATTENDANT', 'COURIER'], extraErrors: [404], description: deliveryDescription }),
    patch: operation(nested ? 'updateOrderDelivery' : 'updateDelivery', nested ? 'Relacionamentos' : 'Entregas', 'Atualizar atribuição ou andamento da entrega', { body: 'DeliveryPatch', response: 'DeliveryResponse', params: [parameter(paramName)], roles: ['ATTENDANT', 'COURIER'], extraErrors: [404, 409], description: deliveryUpdateDescription, examples: deliveryExamples }),
    delete: operation(nested ? 'deleteOrderDelivery' : 'deleteDelivery', nested ? 'Relacionamentos' : 'Entregas', 'Excluir entrega logicamente', { code: 204, params: [parameter(paramName)], extraErrors: [404, 409], description: deliveryDeleteDescription }),
  };
}
paths['/public/tracking/{trackingCode}'] = {
  get: operation('getPublicTracking', 'Rastreamento público', 'Consultar pacote sem cadastro ou autenticação', { publicAccess: true, response: 'TrackingResponse', params: [parameter('trackingCode')], extraErrors: [404, 429], description: 'Somente código UUID v4 da entrega. Sem listagem pública. Retorna apenas código, situação, datas e eventos públicos. Não expõe pessoas, endereço, produtos, valores, notas, motivo detalhado de falha ou IDs internos. Reatribuições repetidas são omitidas. Entrega ou pedido excluído retorna 404. Limite compartilhado de 30 consultas por IP/60 segundos, incluindo códigos inválidos/inexistentes. Respostas sem cache.' }),
};

const responses = Object.fromEntries(Object.entries(errors).map(([status, [name, description]]) => [name, { description, content: { 'application/json': { schema: ref('Error'), example: { error: { code: ({ 400: 'VALIDATION_ERROR', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 429: 'RATE_LIMITED', 500: 'INTERNAL_ERROR' })[status], message: description } } } }, ...(status === '429' ? { headers: { 'Retry-After': { description: 'Segundos até nova consulta permitida.', schema: { type: 'integer', minimum: 1 } }, 'X-RateLimit-Limit': { schema: { type: 'integer', example: 30 } }, 'X-RateLimit-Remaining': { schema: { type: 'integer', example: 0 } } } } : {}) }]));
paths['/auth/login'].post.responses[200].headers = { 'Set-Cookie': { description: 'recifeDocs com JWT da sessão, HttpOnly, SameSite=Strict, Path=/api-docs e expiração igual ao token. Secure em produção. Não autentica outras rotas.', schema: { type: 'string' } } };
paths['/auth/logout'].post.responses[204].headers = { 'Set-Cookie': { description: 'Remove cookie da documentação.', schema: { type: 'string' } } };
paths['/public/tracking/{trackingCode}'].get.responses[200].headers = { 'Cache-Control': { schema: { type: 'string', example: 'no-store' } }, 'X-RateLimit-Limit': { schema: { type: 'integer', example: 30 } }, 'X-RateLimit-Remaining': { schema: { type: 'integer', example: 29 } } };
paths['/api-docs/'] = { get: { operationId: 'getSwaggerUI', tags: ['Documentação'], summary: 'Abrir Swagger UI autenticado', description: 'Documentação técnica padrão, não é frontend do cliente. Interface e todos os arquivos exigem sessão válida via Bearer ou cookie exclusivo da documentação emitido no login.', security: [{ bearerAuth: [] }, { docsCookie: [] }], responses: { 200: { description: 'Interface padrão Swagger UI.', content: { 'text/html': { schema: { type: 'string' } } } }, 401: responseRef(401), 500: responseRef(500) } } };
paths['/api-docs/openapi.json'] = { get: { operationId: 'getOpenAPI', tags: ['Documentação'], summary: 'Obter esquema OpenAPI autenticado', security: [{ bearerAuth: [] }, { docsCookie: [] }], responses: { 200: { description: 'Documento OpenAPI 3.0.3.', content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } } }, 401: responseRef(401), 500: responseRef(500) } } };

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Recife Express API', version: '0.1.0', description: 'Backend acadêmico de pedidos e entregas locais. Autenticação de atendentes e entregadores; clientes consultam somente o rastreamento público, sem conta. Contatos, produtos e pedidos são isolados por atendente; entregas são limitadas ao proprietário do pedido ou ao entregador atribuído. IDs alheios retornam 404. Valores monetários de saída são textos decimais. Alterações com histórico usam transações. Para executar operações protegidas, use Authorize com o accessToken do login, sem o prefixo Bearer. O cookie da documentação não substitui o Bearer da API. Sem frontend de cliente neste repositório.' },
  servers: [{ url: '/', description: 'Mesma origem da API (local ou publicada)' }],
  tags: ['Autenticação', 'Conta', 'Contatos', 'Produtos', 'Pedidos', 'Relacionamentos', 'Entregas', 'Rastreamento público', 'Documentação'].map(name => ({ name })),
  security: [{ bearerAuth: [] }],
  paths,
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'accessToken do login; sessão verificada no PostgreSQL em cada chamada.' }, docsCookie: { type: 'apiKey', in: 'cookie', name: 'recifeDocs', description: 'Cookie HttpOnly do login, aceito somente em /api-docs, com a mesma sessão revogável.' } }, schemas, responses },
};
