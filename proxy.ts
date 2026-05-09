import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/auth")) return NextResponse.next()

  const isLoginPage = pathname === "/"
  const isProtected = pathname.startsWith("/dashboard")

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
