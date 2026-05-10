import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"

declare module "next-auth" {
  interface User {
    teacherId?: number | null
    role?: string | null
  }
  interface Session {
    user: {
      id: string
      name: string
      teacherId?: number | null
      role?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    teacherId?: number | null
    role?: string | null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { username: credentials.username as string },
          include: { teacher: { include: { title: true } } },
        })

        if (!user) return null

        const valid = verifyPassword(credentials.password as string, user.passwordHash)
        if (!valid) return null

        const fullName = user.teacher
          ? `${user.teacher.title.name}${user.teacher.firstName} ${user.teacher.lastName}`
          : user.username

        return {
          id: String(user.id),
          name: fullName,
          email: `${user.username}@school.ac.th`,
          teacherId: user.teacherId,
          role: user.teacher?.role ?? null,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.teacherId = user.teacherId
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.teacherId = token.teacherId
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
})
