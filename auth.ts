import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

const DEMO_USERS = [
  { id: "1", username: "admin", password: "admin123", name: "ผู้ดูแลระบบ", role: "admin" },
  { id: "2", username: "teacher", password: "teacher123", name: "ครูประจำชั้น", role: "teacher" },
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = DEMO_USERS.find(
          (u) =>
            u.username === credentials.username &&
            u.password === credentials.password
        )

        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          email: `${user.username}@school.ac.th`,
        }
      },
    }),
  ],
  pages: {
    signIn: "/",
  },
  session: { strategy: "jwt" },
})
