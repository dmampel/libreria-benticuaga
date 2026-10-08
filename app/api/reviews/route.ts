import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const data = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { customerName: true, rating: true, comment: true, createdAt: true },
    })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Reviews error:", error)
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 })
  }
}
