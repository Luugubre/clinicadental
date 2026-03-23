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

  // 1. Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  
  console.log("------------------------------------------");
  console.log(`Ruta solicitada: ${pathname}`);

  // 2. PROTECCIÓN BÁSICA: Si no hay usuario y no es login/register -> Al Login
  if (!user && pathname !== '/login' && pathname !== '/register') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 3. Si el usuario ya está autenticado y va a login/register -> Al Inicio
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 4. PROTECCIÓN DE ROL: Si intenta entrar a /administracion
  if (user && pathname.startsWith('/administracion')) {
    // Consultamos el rol en la tabla perfiles
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    console.log(`Usuario: ${user.email} | Rol detectado: ${perfil?.rol}`);

    // Si no es ADMIN, lo redirigimos a la página principal
    if (perfil?.rol !== 'ADMIN') {
      console.log("ACCESO DENEGADO: Redirigiendo a / (No es ADMIN)");
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  console.log("ACCIÓN: Permitir paso");
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}