// app/clientes/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

type GeneroCliente = 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'NO_INFORMA';
type GrupoEdadCliente =
  | 'MENOR_18'
  | 'ED_18_25'
  | 'ED_26_35'
  | 'ED_36_45'
  | 'ED_46_60'
  | 'MAYOR_60';

export async function createCliente(formData: FormData) {
  const supabase = await createClient();

  // 1) Require authenticated user (optional, but explicit)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error('Error obteniendo usuario autenticado:', authError.message);
    throw new Error('No se pudo verificar el usuario autenticado.');
  }

  if (!user) {
    // Si quieres redirigir al login directamente:
    redirect('/login');
  }

  // 2) Leer y normalizar campos del formulario

  // Nombre (obligatorio)
  const nombreRaw = formData.get('nombre');
  const nombre = typeof nombreRaw === 'string' ? nombreRaw.trim() : '';

  if (!nombre) {
    throw new Error('El nombre del cliente es obligatorio.');
  }

  // Documento (opcional, pero único si se envía)
  const documentoRaw = formData.get('documento');
  const documento =
    typeof documentoRaw === 'string' && documentoRaw.trim() !== ''
      ? documentoRaw.trim()
      : null;

  // Celular (opcional)
  const celularRaw = formData.get('celular');
  const celular =
    typeof celularRaw === 'string' && celularRaw.trim() !== ''
      ? celularRaw.trim()
      : null;

  // Género (enum opcional)
  const generoRaw = formData.get('genero');
  let genero: GeneroCliente | null = null;

  if (typeof generoRaw === 'string' && generoRaw !== '') {
    if (
      generoRaw === 'MASCULINO' ||
      generoRaw === 'FEMENINO' ||
      generoRaw === 'OTRO' ||
      generoRaw === 'NO_INFORMA'
    ) {
      genero = generoRaw;
    } else {
      console.warn('Valor de género no válido recibido:', generoRaw);
      throw new Error('Género no válido.');
    }
  }

  // Grupo de edad (enum opcional)
  const grupoEdadRaw = formData.get('grupo_edad');
  let grupoEdad: GrupoEdadCliente | null = null;

  if (typeof grupoEdadRaw === 'string' && grupoEdadRaw !== '') {
    if (
      grupoEdadRaw === 'MENOR_18' ||
      grupoEdadRaw === 'ED_18_25' ||
      grupoEdadRaw === 'ED_26_35' ||
      grupoEdadRaw === 'ED_36_45' ||
      grupoEdadRaw === 'ED_46_60' ||
      grupoEdadRaw === 'MAYOR_60'
    ) {
      grupoEdad = grupoEdadRaw;
    } else {
      console.warn('Valor de grupo_edad no válido recibido:', grupoEdadRaw);
      throw new Error('Grupo de edad no válido.');
    }
  }


  // 3) Insertar en la tabla clientes de forma explícita
  // Campos según el esquema:
  //  nombre, documento, celular, genero, grupo_edad, edad_estimada
  const { data: insertData, error: insertError } = await supabase
    .from('clientes')
    .insert([
      {
        nombre,
        documento,
        celular,
        genero,
        grupo_edad: grupoEdad,
      },
    ])
    .select('id') // queremos el id para redirigir o debug
    .single();

  if (insertError) {
    // Manejo explícito de error de unicidad en documento (23505)
    if (insertError.code === '23505') {
      console.error(
        'Error de unicidad al crear cliente (posible documento duplicado):',
        insertError.message,
      );
      throw new Error(
        'No se pudo crear el cliente: el documento ya existe en el sistema.',
      );
    }

    console.error('Error insertando cliente:', insertError.message);
    throw new Error('No se pudo crear el cliente.');
  }

  const nuevoClienteId = insertData?.id as string | undefined;

  // 4) Revalidar lista de clientes
  revalidatePath('/clientes');

  // 5) Redirigir: o bien al detalle del cliente nuevo, o a la lista
  if (nuevoClienteId) {
    redirect(`/clientes/${nuevoClienteId}`);
  } else {
    redirect('/clientes');
  }
}
