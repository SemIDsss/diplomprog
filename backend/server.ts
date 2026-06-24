import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { prisma } from './db';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from './src/utils/jwt';

console.log('🔄 Загрузка сервера...');

// ==================== CONTEXT ====================
const createContext = async ({ req }: any) => {
  const authHeader = req.headers.authorization;
  let user = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    user = verifyToken(token);
  }
  return { user, prisma };
};

// ==================== TYPEDEFS ====================
const typeDefs = `#graphql
  type Subcategory { id: ID!, name: String!, categoryId: String! }
  type Category { id: ID!, name: String!, subcategories: [Subcategory!] }
  type Product {
    id: ID!
    title: String!
    description: String
    price: Float!
    image: String
    status: String!
    subcategoryId: String!
    sku: String
    brand: String
    material: String
    color: String
    weight: Float
    width: Float
    height: Float
    depth: Float
    year: Int
    country: String
    season: String
    collection: String
    images: [String!]!
    rejectReason: String
    user: User
  }
  type CartItem { id: ID!, userId: String!, productId: String!, quantity: Int!, product: Product! }
type User {
  id: ID!
  email: String!
  role: String!
  createdAt: String!
  isBlocked: Boolean 
  blockReason: String
  _count: UserCount
}
  type UserCount { products: Int! orders: Int! }
  type AuthResponse { token: String!, user: User! }
  type PaymentResponse { paymentUrl: String!, orderId: String! }

  type OrderItem {
    id: ID!
    productId: String!
    quantity: Int!
    price: Float!
    product: Product!
  }

  type Order {
    id: ID!
    userId: String!
    totalAmount: Float!
    deliveryMethod: String!
    deliveryPrice: Float!
    status: String!
    createdAt: String!
    user: User
    items: [OrderItem!]!
  }

  type Review {
    id: ID!
    productId: ID!
    userName: String!
    rating: Int!
    comment: String!
    createdAt: String!
    product: Product
  }

  type ProductsConnection {
    items: [Product!]!
    totalCount: Int!
    hasMore: Boolean!
  }

  type Query {
    categories: [Category]
    products(subcategoryId: String, search: String, skip: Int, take: Int): ProductsConnection!
    product(id: ID!): Product
    cart(userId: String!): [CartItem]
    orders(userId: String!): [Order]
    userProfile(userId: String!): User
    pendingProducts: [Product]
    reviews(productId: ID!): [Review!]!
    
    # Админские запросы
    users: [User!]!
    productsAll: [Product!]!
    ordersAll: [Order!]!
    reviewsAll: [Review!]!
    userCount: Int!
    productCount: Int!
    orderCount: Int!
    totalRevenue: Float!
    productsCount(status: String!): Int!
  }

  type Mutation {
    # ---------- Аутентификация ----------
    register(email: String!, password: String!, role: String!): AuthResponse!
    login(email: String!, password: String!): AuthResponse!

    # ---------- Корзина ----------
    addToCart(userId: String!, productId: String!, quantity: Int!): CartItem!
    deleteFromCart(id: ID!): Boolean!

    # ---------- Заказы и оплата ----------
    createOrder(deliveryMethod: String!): Order!
    initiatePayment(orderId: String!, method: String!): PaymentResponse!
    approveOrder(orderId: String!): Order!

    # ---------- Товары ----------
    createProduct(
      title: String!
      description: String
      price: Float!
      subcategoryId: String!
      sku: String
      brand: String
      material: String
      color: String
      weight: Float
      width: Float
      height: Float
      depth: Float
      year: Int
      country: String
      season: String
      collection: String
      images: [String!]
    ): Product!
    approveProduct(id: ID!): Boolean!
    rejectProduct(id: ID!, reason: String!): Boolean!

    # ---------- Категории и подкатегории ----------
    createCategory(name: String!): Category!
    createSubcategory(name: String!, categoryId: String!): Subcategory!

    # ---------- Отзывы ----------
    createReview(productId: ID!, userName: String!, rating: Int!, comment: String!): Review!

    # ---------- Админские мутации ----------
    updateUserRole(userId: ID!, role: String!): User!
    updateOrderStatus(orderId: ID!, status: String!): Order!
    deleteReview(id: ID!): Boolean!
    deleteCategory(id: ID!): Boolean!
    blockUser(userId: ID!, reason: String!): User!
    unblockUser(userId: ID!): User!
  }
`;

// ==================== RESOLVERS ====================
const resolvers = {
  Query: {
    // ---------- Публичные запросы ----------
    categories: async () => {
      try {
        return await prisma.category.findMany({ include: { subcategories: true } });
      } catch (e) { return []; }
    },

    products: async (_: any, { subcategoryId, search, skip = 0, take = 20 }: any) => {
      try {
        const whereClause: any = { status: 'APPROVED' };
        if (subcategoryId) whereClause.subcategoryId = subcategoryId;
        if (search && search.trim() !== '') {
          whereClause.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ];
        }
        const [items, totalCount] = await Promise.all([
          prisma.product.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { createdAt: 'desc' }
          }),
          prisma.product.count({ where: whereClause })
        ]);
        return { items, totalCount, hasMore: skip + take < totalCount };
      } catch (e) {
        console.error('Ошибка поиска Prisma:', e);
        return { items: [], totalCount: 0, hasMore: false };
      }
    },

    product: async (_: any, { id }: { id: string }) => {
      try {
        return await prisma.product.findUnique({ where: { id } });
      } catch (e) { return null; }
    },

    cart: async (_: any, { userId }: any, context: any) => {
      if (!context.user || context.user.userId !== userId) {
        throw new Error('Не авторизован для просмотра этой корзины');
      }
      try {
        return await prisma.cartItem.findMany({
          where: { userId },
          include: { product: true }
        });
      } catch (e) { return []; }
    },

    orders: async (_: any, { userId }: { userId: string }, context: any) => {
      if (!context.user || context.user.userId !== userId) {
        throw new Error('Не авторизован для просмотра этих заказов');
      }
      try {
        const dbOrders = await prisma.order.findMany({
          where: { userId },
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' }
        });
        return dbOrders.map(o => ({ ...o, createdAt: String(new Date(o.createdAt).getTime()) }));
      } catch (e) { return []; }
    },

    userProfile: async (_: any, { userId }: { userId: string }, context: any) => {
      if (!context.user || context.user.userId !== userId) {
        throw new Error('Не авторизован для просмотра этого профиля');
      }
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return null;
        return { id: user.id, email: user.email, role: String(user.role) };
      } catch (e) { return null; }
    },

    pendingProducts: async (_: any, __: any, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      try {
        return await prisma.product.findMany({ where: { status: 'PENDING' } });
      } catch (e) { return []; }
    },

    reviews: async (_: any, { productId }: { productId: string }) => {
      try {
        return await prisma.review.findMany({
          where: { productId },
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) { return []; }
    },

    // ---------- Админские запросы ----------
    users: async () => {
      return await prisma.user.findMany({
        include: { _count: { select: { products: true, orders: true } } }
      });
    },

    productsAll: async () => {
      return await prisma.product.findMany({
        include: { user: { select: { email: true } } }
      });
    },

    ordersAll: async () => {
      return await prisma.order.findMany({
        include: {
          user: { select: { email: true } },
          items: { include: { product: { select: { title: true } } } }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    reviewsAll: async () => {
      return await prisma.review.findMany({
        include: { product: { select: { title: true } } },
        orderBy: { createdAt: 'desc' }
      });
    },

    userCount: async () => await prisma.user.count(),
    productCount: async () => await prisma.product.count(),
    orderCount: async () => await prisma.order.count(),
    totalRevenue: async () => {
      const result = await prisma.order.aggregate({
        where: { status: 'APPROVED' },
        _sum: { totalAmount: true }
      });
      return result._sum.totalAmount || 0;
    },
    productsCount: async (_: any, { status }: { status: string }) => {
      return await prisma.product.count({ where: { status } });
    }
  },

  Mutation: {
    // ==================== АУТЕНТИФИКАЦИЯ ====================
    register: async (_: any, { email, password, role }: any) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error('Пользователь с таким email уже зарегистрирован');

      let finalRole: Role = Role.USER;
      if (role === 'SELLER') finalRole = Role.SELLER;
      if (role === 'ADMIN') {
        throw new Error('Регистрация администратора запрещена.');
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    role: finalRole,
    createdAt: new Date(),
    updatedAt: new Date(),
    // isBlocked и blockReason не передаём – будут значения по умолчанию из схемы
  }
});

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: String(user.role)
      });

      return {
        token,
        user: { id: user.id, email: user.email, role: String(user.role) }
      };
    },

    login: async (_: any, { email, password }: any) => {
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        throw new Error('Неверный адрес электронной почты или пароль');
      }

      // Проверка блокировки
      if (user.isBlocked) {
        throw new Error(`Ваш аккаунт заблокирован. Причина: ${user.blockReason || 'Не указана'}`);
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

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: String(user.role)
      });

      return {
        token,
        user: { id: user.id, email: user.email, role: String(user.role) }
      };
    },

    // ==================== КОРЗИНА ====================
    addToCart: async (_: any, { userId, productId, quantity }: any, context: any) => {
      if (!context.user || context.user.userId !== userId) {
        throw new Error('Не авторизован для изменения этой корзины');
      }
      const existingItem = await prisma.cartItem.findFirst({ where: { userId, productId } });
      if (existingItem) {
        return await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: { product: true }
        });
      }
      return await prisma.cartItem.create({
        data: { userId, productId, quantity },
        include: { product: true }
      });
    },

    deleteFromCart: async (_: any, { id }: { id: string }, context: any) => {
      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        select: { userId: true }
      });
      if (!cartItem) return false;
      if (!context.user || context.user.userId !== cartItem.userId) {
        throw new Error('Не авторизован для удаления этого элемента');
      }
      try {
        await prisma.cartItem.delete({ where: { id } });
        return true;
      } catch (e) { return false; }
    },

    // ==================== ЗАКАЗЫ И ОПЛАТА ====================
    createOrder: async (_: any, { deliveryMethod }: any, context: any) => {
      if (!context.user) {
        throw new Error('Не авторизован');
      }
      const userId = context.user.userId;
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        include: { product: true }
      });
      if (cartItems.length === 0) {
        throw new Error('Корзина пуста');
      }
      const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      const order = await prisma.$transaction(async (prisma) => {
        const newOrder = await prisma.order.create({
          data: {
            userId,
            deliveryMethod,
            totalAmount,
            status: 'PENDING',
            deliveryPrice: 0,
            items: {
              create: cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product.price
              }))
            }
          },
          include: { items: { include: { product: true } } }
        });
        await prisma.cartItem.deleteMany({ where: { userId } });
        return newOrder;
      });
      return order;
    },

    initiatePayment: async (_: any, { orderId, method }: any, context: any) => {
      if (!context.user) {
        throw new Error('Не авторизован');
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Заказ не найден');
      if (order.userId !== context.user.userId) throw new Error('Нет доступа к этому заказу');
      if (order.status !== 'PENDING') throw new Error('Заказ уже оплачен или отменен');

      const paymentUrl = `http://localhost:3000/payment?orderId=${orderId}&amount=${order.totalAmount}&method=${method}`;
      return {
        paymentUrl,
        orderId: order.id
      };
    },

    approveOrder: async (_: any, { orderId }: { orderId: string }, context: any) => {
      if (!context.user) throw new Error('Не авторизован');
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Заказ не найден');
      if (order.userId !== context.user.userId) throw new Error('Нет доступа к этому заказу');
      return await prisma.order.update({
        where: { id: orderId },
        data: { status: 'APPROVED' }
      });
    },

    // ==================== ТОВАРЫ ====================
    createProduct: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error('Необходимо авторизоваться');
      }
      if (context.user.role !== 'SELLER' && context.user.role !== 'ADMIN') {
        throw new Error('Только продавцы могут создавать товары');
      }

      const {
        title, description, price, subcategoryId,
        sku, brand, material, color, weight, width, height, depth,
        year, country, season, collection, images
      } = args;

      return await prisma.product.create({
        data: {
          title,
          description,
          price,
          subcategoryId,
          status: 'PENDING',
          userId: context.user.userId,
          sku: sku || null,
          brand: brand || null,
          material: material || null,
          color: color || null,
          weight: weight ? parseFloat(weight) : null,
          width: width ? parseFloat(width) : null,
          height: height ? parseFloat(height) : null,
          depth: depth ? parseFloat(depth) : null,
          year: year ? parseInt(year) : null,
          country: country || null,
          season: season || null,
          collection: collection || null,
          images: images || [],
          createdAt: new Date(),
          updatedAt: new Date(),
          rejectReason: null
        }
      });
    },

    approveProduct: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Не авторизован');
      if (context.user.role !== 'ADMIN') throw new Error('Только администратор может одобрять товары');
      try {
        await prisma.product.update({ where: { id }, data: { status: 'APPROVED', rejectReason: null } });
        return true;
      } catch (e) { return false; }
    },

    rejectProduct: async (_: any, { id, reason }: { id: string, reason: string }, context: any) => {
      if (!context.user) throw new Error('Не авторизован');
      if (context.user.role !== 'ADMIN') throw new Error('Только администратор может отклонять товары');
      try {
        await prisma.product.update({
          where: { id },
          data: { status: 'REJECTED', rejectReason: reason }
        });
        return true;
      } catch (e) {
        return false;
      }
    },

    // ==================== КАТЕГОРИИ ====================
    createCategory: async (_: any, { name }: { name: string }) => {
      try {
        return await prisma.category.create({ data: { name } });
      } catch (error: any) {
        throw new Error('Ошибка создания категории: ' + error.message);
      }
    },

    createSubcategory: async (_: any, { name, categoryId }: { name: string, categoryId: string }) => {
      try {
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) throw new Error('Категория не найдена');
        return await prisma.subcategory.create({ data: { name, categoryId } });
      } catch (error: any) {
        throw new Error('Ошибка создания подкатегории: ' + error.message);
      }
    },

    // ==================== ОТЗЫВЫ ====================
    createReview: async (_: any, { productId, userName, rating, comment }: any, context: any) => {
      if (!context.user) {
        throw new Error('Необходимо авторизоваться для оставления отзыва');
      }
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Товар не найден');
      return await prisma.review.create({
        data: {
          productId,
          userName: userName || context.user.email || 'Аноним',
          rating,
          comment,
          createdAt: new Date()
        }
      });
    },

    // ==================== АДМИНСКИЕ МУТАЦИИ ====================
    updateUserRole: async (_: any, { userId, role }: { userId: string, role: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      return await prisma.user.update({
        where: { id: userId },
        data: { role: role as Role }
      });
    },

    updateOrderStatus: async (_: any, { orderId, status }: { orderId: string, status: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      return await prisma.order.update({
        where: { id: orderId },
        data: { status }
      });
    },

    deleteReview: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      await prisma.review.delete({ where: { id } });
      return true;
    },

    deleteCategory: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      await prisma.category.delete({ where: { id } });
      return true;
    },

    blockUser: async (_: any, { userId, reason }: { userId: string, reason: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      return await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: true, blockReason: reason }
      });
    },

    unblockUser: async (_: any, { userId }: { userId: string }, context: any) => {
      if (!context.user || context.user.role !== 'ADMIN') {
        throw new Error('Доступ запрещен. Только для администраторов.');
      }
      return await prisma.user.update({
        where: { id: userId },
        data: { isBlocked: false, blockReason: null }
      });
    }
  }
};

// ==================== SERVER ====================
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  try {
    console.log('🔄 Инициализация сервера...');
    const { url } = await startStandaloneServer(server, {
      listen: { port: 5000 },
      context: createContext,
      cors: {
        origin: 'http://localhost:3000',
        credentials: true,
        methods: ['POST', 'GET', 'OPTIONS']
      }
    });
    console.log(`✅ Сервер GraphQL успешно запущен: ${url}`);
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    throw error;
  }
}

startServer().catch((err) => {
  console.error('❌ Критическая ошибка:', err);
  process.exit(1);
});