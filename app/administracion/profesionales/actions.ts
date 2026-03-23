'use server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function crearCuentaStaff(formData: any) {
  const { nombre, apellido, correo, password, rol, especialidad_id } = formData;
  const nombreCompleto = `${nombre} ${apellido}`
  let authUserId: string | null = null;

  try {
    // 1. Crear usuario en el sistema de Autenticación (Auth)
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo.trim().toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: { nombre_completo: nombreCompleto, rol: rol }
    })

    if (authError) throw new Error(authError.message);
    authUserId = data.user.id;

    // 2. Registro en la tabla Perfiles (Universal para todos los empleados)
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .upsert([{ id: authUserId, nombre_completo: nombreCompleto, rol: rol }], { onConflict: 'id' })
    
    if (perfilError) throw perfilError;

    // 3. Si el rol es DENTISTA, registrar en la tabla específica de profesionales para la agenda
    if (rol === 'DENTISTA') {
      const { error: dbError } = await supabaseAdmin
        .from('profesionales')
        .upsert([{
          user_id: authUserId,
          nombre: nombre,
          apellido: apellido,
          especialidad_id: especialidad_id || null,
          activo: true
        }], { onConflict: 'user_id' })

      if (dbError) throw dbError;
    }

    return { success: true }

  } catch (error: any) {
    if (authUserId && error.code !== '23505') {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }
    return { error: error.message }
  }
}

export async function actualizarCuentaStaff(id: string, userId: string, formData: any) {
  try {
    const { nombre, apellido, especialidad_id, rol } = formData;
    const nombreCompleto = `${nombre} ${apellido}`
    
    await supabaseAdmin.from('perfiles').update({ nombre_completo: nombreCompleto, rol: rol }).eq('id', userId)

    if (rol === 'DENTISTA') {
      await supabaseAdmin.from('profesionales').update({
        nombre, apellido, especialidad_id: especialidad_id || null
      }).eq('user_id', userId)
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function eliminarCuentaStaff(userId: string) {
  try {
    await supabaseAdmin.from('profesionales').delete().eq('user_id', userId);
    await supabaseAdmin.from('perfiles').delete().eq('id', userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}