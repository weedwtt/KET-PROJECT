"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"

export async function createUser(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  if (!username) throw new Error("username is required")
  if (!password) throw new Error("password is required")

  await db.user.create({ data: { username, passwordHash: hashPassword(password) } })
  revalidatePath("/")
}
