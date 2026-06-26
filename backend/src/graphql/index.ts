import { prisma } from '../db';
import { Role, OrderStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../utils/jwt';
import { z } from 'zod';
import { PaymentService } from '../payment';
import { cache } from '../cache'; // <-- добавлен импорт кэша

// ==================== TYPEDEFS ====================
export const typeDefs = `#graphql
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
    stock: Int!        
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

  type AuthResponse {
    user: User!
    token: String!
  }

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

  input OrderItemInput {
    productId: String!
    quantity: Int!
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
    me: User
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
    logout: Boolean!

    # ---------- Корзина ----------
    addToCart(userId: String!, productId: String!, quantity: Int!): CartItem!
    deleteFromCart(id: ID!): Boolean!

    # ---------- Заказы и оплата ----------
    initiatePayment(orderId: String!, method: String!, returnUrl: String!): PaymentResponse!
    approveOrder(orderId: String!): Order!
    createOrder(deliveryMethod: String!, items: [OrderItemInput!]): Order!

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
      stock: Int!     
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
export const resolvers = {
  Query: {
    // ---------- Публичные запросы (ОПТИМИЗИРОВАНЫ) ----------
    categories: async () => {
      const cacheKey = 'all_categories';
      let data = cache.get(cacheKey);
      if (data) return data;
      try {
        data = await prisma.category.findMany({ include: { subcategories: true } });
        cache.set(cacheKey, data);
        return data;
      } catch (e) { return []; }
    },

    products: async (_: any, { subcategoryId, search, skip = 0, take = 20 }: any) => {
      const cacheKey = `products_${subcategoryId || 'all'}_${search || ''}_${skip}_${take}`;
      let cached = cache.get(cacheKey);
      if (cached) return cached;

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
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              image: true,
              stock: true,
              subcategoryId: true,
            }
          }),
          prisma.product.count({ where: whereClause })
        ]);

        const result = { items, totalCount, hasMore: skip + take < totalCount };
        cache.set(cacheKey, result);
        return result;
      } catch (e) {
        console.error('Ошибка поиска Prisma:', e);
        return { items: [], totalCount: 0, hasMore: false };
      }
    },

    product: async (_: any, { id }: { id: string }) => {
      const cacheKey = `product_${id}`;
      let data = cache.get(cacheKey);
      if (data) return data;
      try {
        data = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            image: true,
            images: true,
            stock: true,
            subcategoryId: true,
            sku: true,
            brand: true,
            material: true,
            color: true,
            weight: true,
            width: true,
            height: true,
            depth: true,
            year: true,
            country: true,
            season: true,
            collection: true,
          }
        });
        if (data) cache.set(cacheKey, data);
        return data;
      } catch (e) { return null; }
    },

    // ---------- Остальные запросы (без изменений) ----------
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

    me: async (_: any, __: any, context: any) => {
      if (!context.user) return null;
      const user = await prisma.user.findUnique({
        where: { id: context.user.userId },
        include: { _count: { select: { products: true, orders: true } } }
      });
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        role: String(user.role),
        createdAt: String(user.createdAt),
        isBlocked: user.isBlocked,
        blockReason: user.blockReason,
        _count: user._count,
      };
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
    register: async (_: any, { email, password, role }: any, context: any) => {
      const emailSchema = z.string().email('Некорректный email');
      const passwordSchema = z.string().min(6, 'Пароль должен быть не менее 6 символов');
      emailSchema.parse(email);
      passwordSchema.parse(password);

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
        }
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: String(user.role)
      });

      const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
      context.res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      return {
        user: { id: user.id, email: user.email, role: String(user.role) },
        token,
      };
    },

    login: async (_: any, { email, password }: any, context: any) => {
      console.log('🔐 Login attempt for:', email);
      const user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        console.warn('❌ User not found:', email);
        throw new Error('Неверный адрес электронной почты или пароль');
      }
      if (user.isBlocked) {
        console.warn('🚫 User blocked:', email, 'Reason:', user.blockReason);
        throw new Error(`Ваш аккаунт заблокирован. Причина: ${user.blockReason || 'Не указана'}`);
      }
      let isPasswordValid = false;
      if (user.password.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } else {
        isPasswordValid = (password === user.password);
      }
      if (!isPasswordValid) {
        console.warn('❌ Invalid password for:', email);
        throw new Error('Неверный адрес электронной почты или пароль');
      }
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: String(user.role),
      });
      console.log('🔑 Token generated for', email, ':', token.substring(0, 20) + '...');

      const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
      const cookieOptions: any = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      };
      if (isProduction) {
        cookieOptions.domain = '.onrender.com';
      }
      context.res.cookie('token', token, cookieOptions);

      console.log('✅ Cookie set with options:', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        domain: isProduction ? '.onrender.com' : undefined,
      });
      console.log('📤 Response headers after cookie:', context.res.getHeaders());

      return {
        user: { id: user.id, email: user.email, role: String(user.role) },
        token,
      };
    },

    logout: async (_: any, __: any, context: any) => {
      context.res.clearCookie('token', { path: '/' });
      return true;
    },

    // ==================== КОРЗИНА ====================
    addToCart: async (_: any, { productId, quantity }: any, context: any) => {
      if (!context.user) throw new Error('Не авторизован');
      const userId = context.user.userId;

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.status !== 'APPROVED') {
        throw new Error('Товар не найден или недоступен');
      }
      if (quantity <= 0) throw new Error('Количество должно быть положительным');

      const existingItem = await prisma.cartItem.findFirst({
        where: { userId, productId }
      });
      if (existingItem) {
        return await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: { product: true }
        });
      } else {
        return await prisma.cartItem.create({
          data: { userId, productId, quantity },
          include: { product: true }
        });
      }
    },

    deleteFromCart: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) throw new Error('Не авторизован');
      const userId = context.user.userId;

      const cartItem = await prisma.cartItem.findUnique({
        where: { id },
        select: { userId: true }
      });
      if (!cartItem) return false;
      if (cartItem.userId !== userId) {
        throw new Error('Не авторизован для удаления этого элемента');
      }
      try {
        await prisma.cartItem.delete({ where: { id } });
        return true;
      } catch (e) { return false; }
    },

    // ==================== ЗАКАЗЫ И ОПЛАТА ====================
    createOrder: async (_: any, { deliveryMethod, items }: any, context: any) => {
      if (!context.user) {
        throw new Error('Не авторизован');
      }
      const userId = context.user.userId;
      let cartItems = items;
      if (!cartItems || cartItems.length === 0) {
        const dbCart = await prisma.cartItem.findMany({
          where: { userId },
          include: { product: true }
        });
        if (dbCart.length === 0) {
          throw new Error('Корзина пуста');
        }
        cartItems = dbCart.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        }));
      }
      for (const item of cartItems) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Товар ${item.productId} не найден`);
        if (product.stock < item.quantity) {
          throw new Error(`Недостаточно товара ${product.title} на складе`);
        }
      }
      let totalAmount = 0;
      const orderItemsData = [];
      for (const item of cartItems) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });
        if (!product) throw new Error(`Товар ${item.productId} не найден`);
        const price = product.price;
        totalAmount += price * item.quantity;
        orderItemsData.push({
          productId: item.productId,
          quantity: item.quantity,
          price: price,
        });
      }
      const order = await prisma.$transaction(async (prisma) => {
        const newOrder = await prisma.order.create({
          data: {
            userId,
            deliveryMethod,
            totalAmount,
            status: 'PENDING',
            deliveryPrice: 0,
            items: {
              create: orderItemsData
            }
          },
          include: { items: { include: { product: true } } }
        });
        for (const item of orderItemsData) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
        if (!items) {
          await prisma.cartItem.deleteMany({ where: { userId } });
        }
        return newOrder;
      });
      return order;
    },

    initiatePayment: async (_: any, { orderId, method, returnUrl }: any, context: any) => {
      if (!context.user) {
        throw new Error('Не авторизован');
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Заказ не найден');
      if (order.userId !== context.user.userId) throw new Error('Нет доступа к этому заказу');
      if (order.status !== 'PENDING') throw new Error('Заказ уже оплачен или отменен');
      const paymentMethod = method === 'SBP' ? 'sbp' : 'bank_card';
      const payment = await PaymentService.createPayment({
        amount: order.totalAmount,
        description: `Оплата заказа ${order.id}`,
        orderId: order.id,
        paymentMethod: paymentMethod,
        returnUrl: returnUrl || `${process.env.FRONTEND_URL}/payment-success?orderId=${order.id}`,
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentId: payment.id },
      });
      return {
        paymentUrl: payment.confirmationUrl,
        orderId: order.id,
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
        year, country, season, collection, images,
        stock   
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
          stock: stock ?? 0,
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
      const userId = context.user.userId;
      const order = await prisma.order.findFirst({
        where: {
          userId: userId,
          status: 'APPROVED',
          items: {
            some: {
              productId: productId
            }
          }
        }
      });
      if (!order) {
        throw new Error('Вы можете оставить отзыв только на товар, который приобрели');
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
        data: { status: status as OrderStatus }
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