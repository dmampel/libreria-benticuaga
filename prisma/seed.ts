import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // 1. Create Brands with stable images
  console.log("Creating brands...")
  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { id: "brand-1" },
      update: { image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=200" },
      create: { id: "brand-1", name: "Faber-Castell", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=200" },
    }),
    prisma.brand.upsert({
      where: { id: "brand-2" },
      update: { image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200" },
      create: { id: "brand-2", name: "Mooving", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200" },
    }),
    prisma.brand.upsert({
      where: { id: "brand-3" },
      update: { image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=200" },
      create: { id: "brand-3", name: "Pizzini", image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=200" },
    }),
    prisma.brand.upsert({
      where: { id: "brand-4" },
      update: { image: "https://images.unsplash.com/photo-1616628188506-4ad85474d75d?auto=format&fit=crop&q=80&w=200" },
      create: { id: "brand-4", name: "Ledesma", image: "https://images.unsplash.com/photo-1616628188506-4ad85474d75d?auto=format&fit=crop&q=80&w=200" },
    }),
    prisma.brand.upsert({
      where: { id: "brand-5" },
      update: { image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=200" },
      create: { id: "brand-5", name: "Stabilo", image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=200" },
    }),
  ])

  // 2. Create Categories with Unsplash Images
  console.log("Creating categories...")
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "escritorio" },
      update: { image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&q=80&w=800" },
      create: { 
        id: "cat-1", 
        name: "Escritorio", 
        slug: "escritorio", 
        icon: "🖥️",
        image: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&q=80&w=800" 
      },
    }),
    prisma.category.upsert({
      where: { slug: "papeleria" },
      update: { image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&q=80&w=800" },
      create: { 
        id: "cat-2", 
        name: "Papelería", 
        slug: "papeleria", 
        icon: "📝",
        image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&q=80&w=800" 
      },
    }),
    prisma.category.upsert({
      where: { slug: "escolar" },
      update: { image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800" },
      create: { 
        id: "cat-3", 
        name: "Escolar", 
        slug: "escolar", 
        icon: "🎒",
        image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800"
      },
    }),
    prisma.category.upsert({
      where: { slug: "arte" },
      update: { image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800" },
      create: { 
        id: "cat-4", 
        name: "Arte", 
        slug: "arte", 
        icon: "🎨",
        image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800"
      },
    }),
  ])

  // 3. Create Products with premium Unsplash images (High compatibility)
  console.log("Creating products...")
  const productsData = [
    { id: "P001", name: "Lápices de Colores x12", brandId: "brand-1", categoryId: "cat-4", retailPrice: 1500, wholesalePrice: 1200, stock: 50, image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800" },
    { id: "P002", name: "Cuaderno Universitario A4", brandId: "brand-4", categoryId: "cat-2", retailPrice: 2500, wholesalePrice: 2000, stock: 100, image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800" },
    { id: "P003", name: "Microfibras x6 Pastel", brandId: "brand-5", categoryId: "cat-1", retailPrice: 3200, wholesalePrice: 2800, stock: 30, image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=800" },
    { id: "P004", name: "Tablero de Dibujo Técnico", brandId: "brand-3", categoryId: "cat-1", retailPrice: 15000, wholesalePrice: 12000, stock: 10, image: "https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&q=80&w=800" },
    { id: "P005", name: "Mochila Ergonómica", brandId: "brand-2", categoryId: "cat-3", retailPrice: 45000, wholesalePrice: 38000, stock: 15, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800" },
    { id: "P006", name: "Resaltadores x4 Boss", brandId: "brand-5", categoryId: "cat-2", retailPrice: 2100, wholesalePrice: 1800, stock: 60, image: "https://images.unsplash.com/photo-1596495573105-d14658e10d1e?auto=format&fit=crop&q=80&w=800" },
    { id: "P007", name: "Sacapuntas Eléctrico", brandId: "brand-1", categoryId: "cat-3", retailPrice: 8500, wholesalePrice: 7000, stock: 12, image: "https://images.unsplash.com/photo-1519336305162-4b6ed6b6fc83?auto=format&fit=crop&q=80&w=800" },
    { id: "P008", name: "Cartuchera Doble Cierre", brandId: "brand-2", categoryId: "cat-3", retailPrice: 5500, wholesalePrice: 4500, stock: 25, image: "https://images.unsplash.com/photo-1622543953495-473ee46a1557?auto=format&fit=crop&q=80&w=800" },
    { id: "P009", name: "Compás de Precisión", brandId: "brand-3", categoryId: "cat-1", retailPrice: 3800, wholesalePrice: 3200, stock: 20, image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800" },
    { id: "P010", name: "Resma Autor A4 500 hjs", brandId: "brand-4", categoryId: "cat-2", retailPrice: 6500, wholesalePrice: 5800, stock: 200, image: "https://images.unsplash.com/photo-1616628188506-4ad85474d75d?auto=format&fit=crop&q=80&w=800" },
  ]

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: { ...p },
      create: { ...p },
    })
  }

  // 3. Create Users
  console.log("Creating users...")
  const hashedPassword = await bcrypt.hash("password123", 10)

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@benticuaga.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "admin@benticuaga.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "Benticuaga",
      role: "RETAIL",
      isAdmin: true,
      emailVerified: new Date(),
    },
  })

  // Normal User 1 (Retail)
  await prisma.user.upsert({
    where: { email: "juan@example.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "juan@example.com",
      password: hashedPassword,
      firstName: "Juan",
      lastName: "Perez",
      role: "RETAIL",
      isAdmin: false,
      address: "Calle Falsa 123",
      phone: "123456789",
      emailVerified: new Date(),
    },
  })

  // Normal User 2 (Wholesale)
  await prisma.user.upsert({
    where: { email: "empresa@libreria.com" },
    update: { emailVerified: new Date() },
    create: {
      email: "empresa@libreria.com",
      password: hashedPassword,
      firstName: "Librería",
      lastName: "Del Norte",
      role: "WHOLESALE",
      isAdmin: false,
      razonSocial: "Librería Del Norte S.A.",
      cuit: "30-12345678-9",
      address: "Av. Corrientes 500",
      phone: "987654321",
      emailVerified: new Date(),
    },
  })

  console.log("✅ Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
