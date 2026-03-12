import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.delete({ name, ...options })
        },
      },
    }
  )

  // --- BLOQUE DE DIAGNÓSTICO ---
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  
  console.log("------------------------------------------");
  console.log(`Ruta solicitada: ${pathname}`);
  console.log(`¿Usuario detectado?: ${user ? 'SÍ (' + user.email + ')' : 'NO'}`);
  // -----------------------------

  // Si no hay usuario y no es login ni register -> Al Login
  if (!user && pathname !== '/login' && pathname !== '/register') {
    console.log("ACCIÓN: Redirigiendo a /login (No autenticado)");
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay usuario y trata de ir al login -> Al Dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    console.log("ACCIÓN: Redirigiendo a / (Ya autenticado)");
    return NextResponse.redirect(new URL('/', request.url))
  }

  console.log("ACCIÓN: Permitir paso");
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}