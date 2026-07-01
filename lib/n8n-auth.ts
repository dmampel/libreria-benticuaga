import { NextRequest } from "next/server"

export function requireN8nAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-n8n-api-key")
  return !!process.env.N8N_API_KEY && apiKey === process.env.N8N_API_KEY
}
