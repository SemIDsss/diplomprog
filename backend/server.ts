import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { prisma } from './db'; 
import { Role } from '@prisma/client'; 
import bcrypt from 'bcrypt';

const typeDefs = `#graphql
  type Subcategory { id: ID!, name: String!, categoryId: String! }
  type Category { id: ID!, name: String!, subcategories: [Subcategory!] }
  type Product { id: ID!, title: String!, description: String, price: Float!, image: String, status: String!, subcategoryId: String! }
  type CartItem { id: ID!, userId: String!, productId: String!, quantity: Int!, product: Product! }
  type User { id: ID!, email: String!, role: String! }
  type AuthResponse { token: String!, user: User! }
  type PaymentResponse { paymentUrl: String!, orderId: String! }
  type Order { id: ID!, userId: String!, deliveryMethod: String!, createdAt: String! }

  type Query {
    categories: [Category]
    products(subcategoryId: String, search: String): [Product] 
    cart(userId: String!): [CartItem]
    orders(userId: String!): [Order]
    userProfile(userId: String!): User
    pendingProducts: [Product]
  }

  type Mutation {
    register(email: String!, password: String!, role: String!): AuthResponse!
    login(email: String!, password: String!): AuthResponse!
    addToCart(userId: String!, productId: String!, quantity: Int!): CartItem!
    deleteFromCart(id: ID!): Boolean!
    createPayment(userId: String!, method: String!): PaymentResponse!
    createProduct(title: String!, description: String, price: Float!, subcategoryId: String!): Product!
    approveProduct(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    categories: async () => {
      try { 
        return await prisma.category.findMany({ include: { subcategories: true } });
      } catch (e) { return []; }
    },
        products: async (_: any, { subcategoryId, search }: { subcategoryId?: string, search?: string }) => {
      try {
        
        const whereClause: any = { status: 'APPROVED' };
        
        
        if (subcategoryId) {
          whereClause.subcategoryId = subcategoryId;
        }
        
        
        if (search && search.trim() !== '') {
          whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }
        
        return await prisma.product.findMany({ where: whereClause });
      } catch (e) {
        console.error('Ошибка поиска Prisma:', e);
        return [];
      }
    },

    cart: async (_: any, { userId }: any) => {
      try { return await prisma.cartItem.findMany({ where: { userId }, include: { product: true } }); } catch (e) { return []; }
    },
    orders: async (_: any, { userId }: { userId: string }) => {
      try {
        const dbOrders = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
        return dbOrders.map(o => ({ ...o, createdAt: String(new Date(o.createdAt).getTime()) }));
      } catch (e) { return []; }
    },
    userProfile: async (_: any, { userId }: { userId: string }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return { id: user.id, email: user.email, role: String(user.role) };
      } catch (e) { return null; }
    },
    pendingProducts: async () => {
      try { return await prisma.product.findMany({ where: { status: 'PENDING' } }); } catch (e) { return []; }
    }
  },
  Mutation: {
    register: async (_: any, { email, password, role }: any) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error('Пользователь с таким email уже зарегистрирован');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let finalRole: Role = Role.USER;
      if (role === 'SELLER') finalRole = Role.SELLER;
      if (role === 'ADMIN') finalRole = Role.ADMIN;

      const user = await prisma.user.create({ 
        data: { email, password: hashedPassword, role: finalRole } 
      });
      return { token: user.id, user: { id: user.id, email: user.email, role: String(user.role) } };
    },

    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findFirst({ where: { email: email } });
      if (!user) {
        throw new Error('Неверный адрес электронной почты или пароль');
      }
      
      let isPasswordValid = false;
      if (user.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        isPasswordValid = (password === user.password);
      }

      if (!isPasswordValid) {
        throw new Error('Неверный адрес электронной почты или пароль');
      }
      
      return { token: user.id, user: { id: user.id, email: user.email, role: String(user.role) } };
    },

    addToCart: async (_: any, { userId, productId, quantity }: any) => {
      const existingItem = await prisma.cartItem.findFirst({ where: { userId, productId } });
      if (existingItem) {
        return await prisma.cartItem.update({ where: { id: existingItem.id }, data: { quantity: existingItem.quantity + quantity }, include: { product: true } });
      }
      return await prisma.cartItem.create({ data: { userId, productId, quantity }, include: { product: true } });
    },
    deleteFromCart: async (_: any, { id }: { id: string }) => {
      try { await prisma.cartItem.delete({ where: { id } }); return true; } catch (e) { return false; }
    },
    createProduct: async (_: any, { title, description, price, subcategoryId }: any) => {
      return await prisma.product.create({ data: { title, description, price, subcategoryId, status: 'PENDING' } });
    },
    approveProduct: async (_: any, { id }: { id: string }) => {
      try { await prisma.product.update({ where: { id }, data: { status: 'APPROVED' } }); return true; } catch (e) { return false; }
    },
    createPayment: async (_: any, { userId, method }: any) => {
      const cartItems = await prisma.cartItem.findMany({ where: { userId }, include: { product: true } });
      if (cartItems.length === 0) throw new Error('Корзина пуста');
      
      const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const order = await prisma.order.create({ data: { userId, deliveryMethod: method } });
      await prisma.cartItem.deleteMany({ where: { userId } });
      
      let finalUrl = '';
      if (method === 'YUKASSA') {
        finalUrl = 'https://yoomoney.ru' + String(totalAmount);
      } else {
        finalUrl = 'https://nspk.ru' + String(totalAmount * 100);
      }
      return { paymentUrl: finalUrl, orderId: order.id };
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 5000 },
    cors: { origin: 'http://localhost:3000', credentials: true, methods: ['POST', 'GET', 'OPTIONS'] }
  });
  console.log(`🚀 Сервер GraphQL запущен: ${url}`);
}
startServer().catch((err) => console.error(err));
