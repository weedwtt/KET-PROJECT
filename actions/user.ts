"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createUser(formData: FormData) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string | undefined;

  if (!email) throw new Error("email is required");

  await prisma.user.create({ data: { email, name } });
  revalidatePath("/");
}
