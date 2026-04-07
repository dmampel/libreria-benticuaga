# Librería Benticuaga - E-commerce

Este es el repositorio oficial del E-commerce para **Librería Benticuaga**. 
El proyecto consiste en una tienda online completa con carrito de compras, gestión de usuarios, catálogos de productos y cobros integrados mediante Mercado Pago.

## 🚀 Tecnologías y Stack

Este proyecto está construido utilizando las últimas tecnologías del ecosistema moderno de desarrollo web:

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Version 16)
- **UI & Componentes**: [React 19](https://react.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Base de Datos & ORM**: [Prisma](https://www.prisma.io/)
- **Pagos**: [Mercado Pago SDK](https://www.mercadopago.com.ar/developers/)
- **Autenticación**: JSON Web Tokens (JWT) y bcrypt

## 📦 Características Principales

- **Catálogo de Productos**: Exploración de productos por categorías.
- **Carrito de Compras**: Gestión ágil de ítems agregados al carrito utilizando Contextos (`CartContext`).
- **Checkout Integrado**: Flujo de pagos seguro con Mercado Pago (Checkout Pro / transparente).
- **Cuentas de Usuario**: Registro, login y visualización del historial de órdenes y estado de cuenta.
- **Gestión Administrativa**: Capacidad para subir productos masivamente vía archivos CSV.
- **Webhooks**: Procesamiento asincrónico de eventos de pago para actualizar automáticamente el estado de los pedidos.

## 🛠️ Instalación y Configuración Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/dmampel/libreria-benticuaga.git
   cd stationery-ecommerce
   ```

2. **Instalar dependencias**:
   (Recomendamos usar `pnpm` como está configurado en el proyecto)
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` o `.env.local` en la raíz del proyecto y agrega tus claves (ej: URLs de base de datos, Secret JWT, Access Token de Mercado Pago).

4. **Correr migraciones de Base de Datos (Prisma)**:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Iniciar el servidor de desarrollo**:
   ```bash
   pnpm dev
   ```

6. **Abrir en el navegador**:
   Ve a [http://localhost:3000](http://localhost:3000) para ver la página renderizada.

## 📝 Scripts Disponibles

- `pnpm dev`: Inicia la aplicación en modo desarrollo.
- `pnpm build`: Construye la aplicación para producción.
- `pnpm start`: Inicia el servidor optimizado con la build de producción.
- `pnpm lint`: Examina la sintaxis y buenas prácticas del código con ESLint.
