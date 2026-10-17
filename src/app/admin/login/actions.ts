"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";

// Hash factice : la vérification prend le même temps que l'utilisateur existe ou non
const DUMMY_HASH = bcrypt.hashSync("mot-de-passe-factice", 12);

let failures: number[] = [];

export async function login(_prev: { error?: string }, formData: FormData): Promise<{ error?: string; username?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const now = Date.now();
  failures = failures.filter((t) => now - t < 15 * 60_000);
  if (failures.length >= 10) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes.", username };
  }

  const user = username ? await prisma.adminUser.findUnique({ where: { username } }) : null;
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    failures.push(now);
    return { error: "Identifiant ou mot de passe incorrect.", username };
  }

  await createSession({ userId: user.id, username: user.username });
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
