--
-- PostgreSQL database dump
--

\restrict qZabel2LF1ObackgseZT0h0g0N3wgNXLP4GUtQVP1zsd0JHFMuwpvZFYKjG1zeW

-- Dumped from database version 15.18 (Debian 15.18-1.pgdg13+1)
-- Dumped by pg_dump version 15.18 (Debian 15.18-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."OrderStatus" OWNER TO admin;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'SELLER',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cart_items (
    id text NOT NULL,
    "userId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL
);


ALTER TABLE public.cart_items OWNER TO admin;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.categories OWNER TO admin;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.order_items (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL
);


ALTER TABLE public.order_items OWNER TO admin;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.orders (
    id text NOT NULL,
    "userId" text NOT NULL,
    "deliveryMethod" text NOT NULL,
    "deliveryPrice" double precision DEFAULT 0 NOT NULL,
    "totalAmount" double precision NOT NULL,
    status public."OrderStatus" DEFAULT 'PENDING'::public."OrderStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymentId" text
);


ALTER TABLE public.orders OWNER TO admin;

--
-- Name: products; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.products (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    price double precision NOT NULL,
    image text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "subcategoryId" text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "rejectReason" text,
    sku text,
    brand text,
    material text,
    color text,
    weight double precision,
    width double precision,
    height double precision,
    depth double precision,
    year integer,
    country text,
    season text,
    collection text,
    images text[],
    stock integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.products OWNER TO admin;

--
-- Name: reviews; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.reviews (
    id text NOT NULL,
    "productId" text NOT NULL,
    "userName" text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reviews OWNER TO admin;

--
-- Name: subcategories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subcategories (
    id text NOT NULL,
    name text NOT NULL,
    "categoryId" text NOT NULL
);


ALTER TABLE public.subcategories OWNER TO admin;

--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockReason" text
);


ALTER TABLE public.users OWNER TO admin;

--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.cart_items (id, "userId", "productId", quantity) FROM stdin;
cmqs5krns0003pa0zsutdapcf	cmqs5knqb0001pa0z9ega99v4	cmqs5jz0i000npaaslwnkntbe	3
cmqsjgzj30002r10z6k72ncum	cmqsjgu8z0000r10zdw75gkyg	cmqs5jz0i000npaaslwnkntbe	4
cmqsltv3y0001q60zv1xw02bo	cmqskw8qv0008o60z1m52pzy0	cmqs5jz0i000npaaslwnkntbe	1
cmqsu2hp4000aqk0zzgm67bk6	cmqskw8qv0008o60z1m52pzy0	cmqs5jyuv0001paasy78sloz6	2
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.categories (id, name) FROM stdin;
cmqs5h5nk0000pa74gf7p6yte	Книги
cmqs5h5nk0001pa7463uo3nr2	Мебель
cmqs5h5nk0002pa7446xu4kkv	Игрушки
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.order_items (id, "orderId", "productId", quantity, price) FROM stdin;
cmqs5l02z0007pa0zoj3mehis	cmqs5l02y0005pa0zrhicpkbg	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs5safa0003t40zylz31lzc	cmqs5saf90001t40zshfdzy6p	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs69gi80003rw0zg6zm2txn	cmqs69gi70001rw0zumyjhy8j	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs6sdxf0003pb108z3boq0t	cmqs6sdxe0001pb1014bnue0w	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs81omd0003s710z0mwi6dx	cmqs81omd0001s7105y7jzo0d	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs8bpmd0007s710uug7zt2a	cmqs8bpmc0005s710g0n4crgo	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs8r579000bs710m0iouy2t	cmqs8r5780009s710hsdht875	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs92fz30003p70z6xeqr89o	cmqs92fz20001p70z1vz95zw2	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs92p3i0007p70zt8qnsutz	cmqs92p3h0005p70z3ll7osku	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs99t0y0003lh0zcuy90j45	cmqs99t0y0001lh0zs2zwwihn	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqs9xppf0003qw0z1eshs8im	cmqs9xppe0001qw0zji70f52e	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqsktfm90003o60zcihq52bc	cmqsktfm80001o60zxkhfygrj	cmqs5jz0i000npaaslwnkntbe	2	2500
cmqsku2ba0007o60zyaxdgyi0	cmqsku2b90005o60z0nnjxj79	cmqs5jz0i000npaaslwnkntbe	2	2500
cmqst6fdw0003qk0zjw2oogxm	cmqst6fdw0001qk0zdybewwhm	cmqs5jz0i000npaaslwnkntbe	1	2500
cmqsu2urg000eqk0z9zq3vro5	cmqsu2urf000cqk0z55b1re06	cmqs5jyuv0001paasy78sloz6	2	450
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.orders (id, "userId", "deliveryMethod", "deliveryPrice", "totalAmount", status, "createdAt", "updatedAt", "paymentId") FROM stdin;
cmqs81omd0001s7105y7jzo0d	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:21:59.269	2026-06-24 15:21:59.269	\N
cmqs8bpmc0005s710g0n4crgo	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:29:47.124	2026-06-24 15:29:47.124	\N
cmqs8r5780009s710hsdht875	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:41:47.156	2026-06-24 15:41:47.156	\N
cmqs92fz20001p70z1vz95zw2	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:50:34.334	2026-06-24 15:50:34.334	\N
cmqs92p3h0005p70z3ll7osku	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:50:46.155	2026-06-24 15:50:46.155	\N
cmqs99t0y0001lh0zs2zwwihn	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 15:56:17.842	2026-06-24 15:56:17.842	\N
cmqs9xppe0001qw0zji70f52e	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	PENDING	2026-06-24 16:14:53.282	2026-06-24 16:14:53.282	\N
cmqsktfm80001o60zxkhfygrj	cmqsjgu8z0000r10zdw75gkyg	cdek	0	5000	PENDING	2026-06-24 21:19:29.36	2026-06-24 21:19:29.789	mock_0251f3df
cmqsku2b90005o60z0nnjxj79	cmqsjgu8z0000r10zdw75gkyg	cdek	0	5000	PENDING	2026-06-24 21:19:58.773	2026-06-24 21:19:59.281	31ce5dc0-000f-5000-b000-165a0d98f1bf
cmqs5l02y0005pa0zrhicpkbg	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	APPROVED	2026-06-24 14:13:01.738	2026-06-24 21:39:38.549	\N
cmqs5saf90001t40zshfdzy6p	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	APPROVED	2026-06-24 14:18:41.733	2026-06-24 21:39:40.237	\N
cmqs69gi70001rw0zumyjhy8j	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	APPROVED	2026-06-24 14:32:02.767	2026-06-24 21:39:41.695	\N
cmqs6sdxe0001pb1014bnue0w	cmqs5knqb0001pa0z9ega99v4	cdek	0	2500	APPROVED	2026-06-24 14:46:45.89	2026-06-24 21:39:42.748	\N
cmqst6fdw0001qk0zdybewwhm	cmqskw8qv0008o60z1m52pzy0	cdek	0	2500	PENDING	2026-06-25 01:13:32.516	2026-06-25 01:13:33.992	31ce947e-000f-5001-8000-19bda7a3dde6
cmqsu2urf000cqk0z55b1re06	cmqskw8qv0008o60z1m52pzy0	cdek	0	900	PENDING	2026-06-25 01:38:45.436	2026-06-25 01:38:45.862	31ce9a65-000f-5000-b000-18ffe10203c3
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.products (id, title, description, price, image, status, "subcategoryId", "userId", "createdAt", "updatedAt", "rejectReason", sku, brand, material, color, weight, width, height, depth, year, country, season, collection, images, stock) FROM stdin;
cmqs5jyvh0003paasp8veb84a	Преступление и наказание	Великий роман Федора Достоевского	350	/images/crime.jpg	APPROVED	cmqs5h5p20006pa74cd6tjdkv	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.515	2026-06-24 14:12:13.515	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/crime.jpg}	100
cmqs5jyw20005paason2udwd4	Война и мир	Эпопея Льва Толстого	500	/images/war.jpg	APPROVED	cmqs5h5p20006pa74cd6tjdkv	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.533	2026-06-24 14:12:13.533	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/war.jpg}	100
cmqs5jyuv0001paasy78sloz6	1984	Культовый роман Джорджа Оруэлла	450	/images/1984.jpg	APPROVED	cmqs5h5p10004pa745y8uhbh1	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.491	2026-06-25 01:38:45.461	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/1984.jpg}	98
cmqs5jywl0007paasvatxy1bh	Мастер и Маргарита	Мистический роман Михаила Булгакова	400	/images/master.jpg	APPROVED	cmqs5h5p20006pa74cd6tjdkv	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.555	2026-06-24 14:12:13.555	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/master.jpg}	100
cmqs5jyx40009paasl3z0mbmr	Деревянный стул	Стул из массива дуба	2500	/images/chair.jpg	APPROVED	cmqs5h5p20008pa74cp7szf0u	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.573	2026-06-24 14:12:13.573	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/chair.jpg}	100
cmqs5jyxn000bpaasseq5b4wa	Офисное кресло	Удобное кресло с подлокотниками	3500	/images/office-chair.jpg	APPROVED	cmqs5h5p20008pa74cp7szf0u	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.592	2026-06-24 14:12:13.592	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/office-chair.jpg}	100
cmqs5jyy4000dpaasvw3ovcmw	Письменный стол	Стол с ящиками для работы	4500	/images/desk.jpg	APPROVED	cmqs5h5p2000apa74koypj4rt	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.61	2026-06-24 14:12:13.61	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/desk.jpg}	100
cmqs5jyyn000fpaassyvb5dlm	Журнальный столик	Стеклянный столик для гостиной	2800	/images/coffee-table.jpg	APPROVED	cmqs5h5p2000apa74koypj4rt	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.627	2026-06-24 14:12:13.627	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/coffee-table.jpg}	100
cmqs5jyz4000hpaas9ejqvjgy	Мишка плюшевый	Мягкая игрушка 50 см	1200	/images/bear.jpg	APPROVED	cmqs5h5p3000cpa7416itqqo1	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.646	2026-06-24 14:12:13.646	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/bear.jpg}	100
cmqs5jyzl000jpaasbavqga3h	Зайка	Плюшевый заяц 40 см	900	/images/rabbit.jpg	APPROVED	cmqs5h5p3000cpa7416itqqo1	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.662	2026-06-24 14:12:13.662	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/rabbit.jpg}	100
cmqs5jz01000lpaasn6sm7u9k	LEGO Город	Конструктор с 500 деталями	3500	/images/lego-city.jpg	APPROVED	cmqs5h5p3000epa74ybnn4wp3	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.679	2026-06-24 14:12:13.679	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/lego-city.jpg}	100
cmqs5jz0i000npaaslwnkntbe	LEGO Космос	Конструктор с 300 деталями	2500	/images/lego-space.jpg	APPROVED	cmqs5h5p3000epa74ybnn4wp3	cmqs5jkmx0000pa0zfpznp8pb	2026-06-24 14:12:13.695	2026-06-25 01:13:32.571	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{/images/lego-space.jpg}	95
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.reviews (id, "productId", "userName", rating, comment, "createdAt") FROM stdin;
cmqslu0zk0003q60zc9z1imei	cmqs5jz0i000npaaslwnkntbe	andr.semidark@gmail.com	5	123	2026-06-24 21:47:56.67
\.


--
-- Data for Name: subcategories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.subcategories (id, name, "categoryId") FROM stdin;
cmqs5h5p10004pa745y8uhbh1	Фантастика	cmqs5h5nk0000pa74gf7p6yte
cmqs5h5p20006pa74cd6tjdkv	Классика	cmqs5h5nk0000pa74gf7p6yte
cmqs5h5p20008pa74cp7szf0u	Стулья	cmqs5h5nk0001pa7463uo3nr2
cmqs5h5p2000apa74koypj4rt	Столы	cmqs5h5nk0001pa7463uo3nr2
cmqs5h5p3000cpa7416itqqo1	Мягкие игрушки	cmqs5h5nk0002pa7446xu4kkv
cmqs5h5p3000epa74ybnn4wp3	Конструкторы	cmqs5h5nk0002pa7446xu4kkv
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (id, email, password, role, "createdAt", "updatedAt", "isBlocked", "blockReason") FROM stdin;
cmqs5jkmx0000pa0zfpznp8pb	123123@ru	$2a$10$i6EK769My/XZ.z.6CoUKgusOr3.e3x92oxEzpMYZPUMz/qZbJMoOW	SELLER	2026-06-24 14:11:55.063	2026-06-24 14:11:55.063	f	\N
cmqs5knqb0001pa0z9ega99v4	andr.ru@ru	$2a$10$8G.N.hA0.kG3VqHgf5ZgBuUeeiBAzw2hqXt0KAHy.b6S/0z8.xeji	USER	2026-06-24 14:12:45.727	2026-06-24 14:12:45.727	f	\N
cmqsjgu8z0000r10zdw75gkyg	Saddd23123@mail.ru	$2a$10$UATYhlVj5kS8Kc55CqBc/O07T0H378WKLW2Oq7Mfxnft5jeg/JE2W	USER	2026-06-24 20:41:42.178	2026-06-24 20:41:42.178	f	\N
cmqskw8qv0008o60z1m52pzy0	andr.semidark@gmail.com	$2a$10$Q4xluv9DRnT5J8JvhyCL7uluNuwk77hVkGmlMjE24ywcHDogfQdCq	ADMIN	2026-06-24 21:21:40.419	2026-06-24 21:37:38.431	f	\N
cmqstn35z0004qk0zcyaz3ufz	test@mail.ru	$2a$10$a758NeSTkvrExANQEDUrz.R9OH4UH6W4QMXDVrra2QqKwilurB0Ha	SELLER	2026-06-25 01:26:29.83	2026-06-25 01:26:29.83	f	\N
\.


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: subcategories subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cart_items_userId_productId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "cart_items_userId_productId_key" ON public.cart_items USING btree ("userId", "productId");


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: order_items_orderId_productId_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "order_items_orderId_productId_key" ON public.order_items USING btree ("orderId", "productId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: cart_items cart_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cart_items cart_items_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: order_items order_items_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: orders orders_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: products products_subcategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES public.subcategories(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: products products_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reviews reviews_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.products(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subcategories subcategories_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subcategories
    ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict qZabel2LF1ObackgseZT0h0g0N3wgNXLP4GUtQVP1zsd0JHFMuwpvZFYKjG1zeW

