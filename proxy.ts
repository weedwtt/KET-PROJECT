import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl

  // ถ้ายังไม่ login และพยายามเข้า /dashboard
  if (!req.auth && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ถ้า login แล้วและเข้า login page ให้ redirect ไป dashboard
  if (req.auth && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
})

export const config = {
  matcher: ["/", "/dashboard/:path*"],
}
