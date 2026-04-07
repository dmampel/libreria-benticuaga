import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CATEGORIES = [
  { name: "Agendas y Planners", slug: "agendas", icon: "📅" },
  { name: "Archivadores y Biblioratos", slug: "archivadores", icon: "🗂️" },
  { name: "Básicos de Escritorio", slug: "basicos", icon: "✏️" },
  { name: "Cafetería y Limpieza", slug: "cafeteria", icon: "☕" },
  { name: "Cartuchos e Impresión", slug: "cartuchos", icon: "🖨️" },
  { name: "Carpetas y Folders", slug: "carpetas", icon: "📁" },
  { name: "Cuadernos y Blocks", slug: "cuadernos", icon: "📓" },
  { name: "Papelería y Resmas", slug: "papeleria", icon: "📄" },
  { name: "Tecnología y Accesorios", slug: "tecnologia", icon: "💻" },
  { name: "Tijeras y Corte", slug: "corte", icon: "✂️" },
]

async function main() {
  console.log("[Seed] Seeding categories...")

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon },
      create: cat,
    })
    console.log(`[Seed] ✓ ${cat.name}`)
  }

  console.log(`[Seed] Done — ${CATEGORIES.length} categories seeded.`)
}

main()
  .catch((e) => {
    console.error("[Seed] Error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
