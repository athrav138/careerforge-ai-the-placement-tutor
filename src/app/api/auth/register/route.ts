import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, toClientUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Please complete all fields." }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Unable to create account." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      let dbUser = await prisma.user.findUnique({ where: { supabaseUserId: data.user.id } });
      if (!dbUser && data.user.email) {
        dbUser = await prisma.user.findUnique({ where: { email: data.user.email } });
        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { supabaseUserId: data.user.id }
          });
        }
      }

      if (!dbUser && data.user.email) {
        await prisma.user.create({
          data: {
            email: data.user.email,
            supabaseUserId: data.user.id,
            name: name || data.user.email.split('@')[0],
            passwordHash,
            studentProfile: {
              create: {}
            }
          }
        });
      }
    } catch (dbError) {
      console.error("Prisma sync error during API signup", dbError);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Account created." }, { status: 201 });
    }

    return NextResponse.json({ user: toClientUser(user) }, { status: 201 });
  } catch (err) {
    console.error("Register API error:", err);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
