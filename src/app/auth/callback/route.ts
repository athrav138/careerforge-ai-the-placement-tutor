import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      try {
        let dbUser = await prisma.user.findUnique({
          where: { supabaseUserId: user.id }
        })

        if (!dbUser && user.email) {
          dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (dbUser) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { supabaseUserId: user.id }
            })
          }
        }

        if (!dbUser && user.email) {
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              supabaseUserId: user.id,
              name: user.user_metadata?.full_name || user.email.split('@')[0],
              passwordHash: 'oauth',
              studentProfile: {
                create: {}
              }
            }
          })
        }
      } catch (dbError) {
        console.error("Error syncing user to Prisma:", dbError)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
