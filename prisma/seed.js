import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database.js';

const seedId = (group, index) => `${group}0000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
const time = minutes => new Date(Date.UTC(2026, 10, 26, 12, minutes));

function configurationError(message) {
  return Object.assign(new Error(message), { name: 'SeedConfigurationError' });
}

async function seed() {
  const password = process.env.SEED_PASSWORD;
  if (!password || [...password].length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw configurationError('Defina SEED_PASSWORD com pelo menos 8 caracteres e no máximo 72 bytes UTF-8.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(73421109)`;
    const users = [];
    const accounts = [
      ['Atendente demonstração 1', 'atendente1@example.com', 'ATTENDANT'],
      ['Atendente demonstração 2', 'atendente2@example.com', 'ATTENDANT'],
      ['Entregador demonstração 1', 'entregador1@example.com', 'COURIER'],
      ['Entregador demonstração 2', 'entregador2@example.com', 'COURIER'],
    ];
    for (const [index, [name, email, role]] of accounts.entries()) {
      const id = seedId(1, index + 1);
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing && existing.id !== id) throw configurationError('Um e-mail de demonstração já pertence a outra conta. Nenhum registro foi alterado.');
      const user = await tx.user.upsert({ where: { id }, update: {}, create: { id, name, email, role, passwordHash, createdAt: time(0) } });
      if (user.role !== role) throw configurationError('Uma conta de demonstração possui perfil incompatível. Nenhum registro foi alterado.');
      users.push({ id: user.id, email: user.email, role: user.role });
    }
    const customers = [];
    const products = [];
    for (let owner = 0; owner < 2; owner++) {
      for (let index = 0; index < 2; index++) {
        const number = owner * 2 + index + 1;
        const customer = await tx.customer.upsert({ where: { id: seedId(2, number) }, update: {}, create: {
          id: seedId(2, number), createdById: users[owner].id, name: `Destinatário fictício ${number}`,
          phone: '(81) 00000-0000', street: 'Rua de demonstração', number: String(number),
          neighborhood: 'Centro', city: 'Recife', complement: null, reference: 'Endereço fictício para demonstração.', createdAt: time(1),
        } });
        const product = await tx.product.upsert({ where: { id: seedId(3, number) }, update: {}, create: {
          id: seedId(3, number), createdById: users[owner].id, name: `Produto demonstração ${number}`,
          description: 'Produto fictício para apresentação acadêmica.', price: index === 0 ? '10.35' : '5.20', createdAt: time(1),
        } });
        customers.push(customer);
        products.push(product);
      }
    }
    const orders = [];
    const deliveries = [];
    for (let index = 0; index < 4; index++) {
      const owner = Math.floor(index / 2);
      const customer = customers[owner * 2];
      const order = await tx.order.upsert({ where: { id: seedId(4, index + 1) }, update: {}, create: {
        id: seedId(4, index + 1), customerId: customer.id, createdById: users[owner].id,
        status: 'READY', notes: 'Pedido fictício de demonstração.', createdAt: time(2),
      } });
      for (let itemIndex = 0; itemIndex < 2; itemIndex++) {
        const product = products[owner * 2 + itemIndex];
        await tx.orderItem.upsert({ where: { id: seedId(5, index * 2 + itemIndex + 1) }, update: {}, create: {
          id: seedId(5, index * 2 + itemIndex + 1), orderId: order.id, productId: product.id,
          quantity: itemIndex + 1, unitPrice: product.price,
        } });
      }
      const { street, number, complement, neighborhood, city, reference } = customer;
      const delivery = await tx.delivery.upsert({ where: { id: seedId(6, index + 1) }, update: {}, create: {
        id: seedId(6, index + 1), orderId: order.id, courierId: users[2 + index % 2].id,
        addressSnapshot: { street, number, complement, neighborhood, city, reference }, assignedAt: time(5), createdAt: time(5),
      } });
      for (const [event, status] of ['RECEIVED', 'PREPARING', 'READY', 'ASSIGNED'].entries()) {
        const id = seedId(7, index * 4 + event + 1);
        await tx.statusHistory.upsert({ where: { id }, update: {}, create: {
          id, orderId: order.id, changedById: users[owner].id, changedAt: time(2 + event),
          ...(status === 'ASSIGNED' ? { deliveryId: delivery.id, deliveryStatus: status } : { orderStatus: status }),
        } });
      }
      orders.push({ id: order.id, customerId: order.customerId, createdById: order.createdById });
      deliveries.push({ id: delivery.id, orderId: delivery.orderId, courierId: delivery.courierId, trackingCode: delivery.trackingCode });
    }
    return {
      message: 'Seed concluído. Registros existentes preservados; senhas não são redefinidas.',
      users,
      customers: customers.map(customer => ({ id: customer.id, createdById: customer.createdById })),
      products: products.map(product => ({ id: product.id, createdById: product.createdById })),
      orders,
      deliveries,
      counts: { users: 4, customers: 4, products: 4, orders: 4, orderItems: 8, deliveries: 4, statusHistory: 16 },
    };
  }, { timeout: 30000 });
}

try {
  console.log(JSON.stringify(await seed(), null, 2));
} catch (error) {
  console.error(error.name === 'SeedConfigurationError' ? error.message : 'Não foi possível concluir o seed. Confira a conexão PostgreSQL e as migrações; a transação não foi aplicada.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
