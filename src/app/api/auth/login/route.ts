import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, toClientUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Invalid email or password." }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: data.user.id }
    });

    if (!dbUser && data.user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: data.user.email }
      });
      if (dbUser) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUserId: data.user.id }
        });
      } else {
        dbUser = await prisma.user.create({
          data: {
            email: data.user.email,
            supabaseUserId: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            passwordHash: 'supabase',
            studentProfile: {
              create: {}
            }
          }
        });
      }
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unable to complete login." }, { status: 500 });
    }

    return NextResponse.json({ user: toClientUser(user) });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Unable to log in." }, { status: 500 });
  }
}
