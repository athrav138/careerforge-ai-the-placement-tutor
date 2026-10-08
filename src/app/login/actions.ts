'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    let dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: data.user.id }
    })

    if (!dbUser && data.user.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: data.user.email }
      })

      if (dbUser) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUserId: data.user.id }
        })
      }
    }

    if (!dbUser && data.user.email) {
      const passwordHash = await bcrypt.hash(password, 10)
      try {
        await prisma.user.create({
          data: {
            email: data.user.email,
            supabaseUserId: data.user.id,
            name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
            passwordHash,
            studentProfile: {
              create: {}
            }
          }
        })
      } catch (dbError) {
        console.error("Prisma sync error during login", dbError)
      }
    }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const name = formData.get('name') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const passwordHash = await bcrypt.hash(password, 10)
    try {
      let dbUser = await prisma.user.findUnique({ where: { supabaseUserId: data.user.id } })
      if (!dbUser && data.user.email) {
        dbUser = await prisma.user.findUnique({ where: { email: data.user.email } })
        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { supabaseUserId: data.user.id }
          })
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
        })
      }
    } catch (dbError) {
      console.error("Prisma sync error during signup", dbError)
    }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}
