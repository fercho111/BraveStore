'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function requireNonEmpty(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) throw new Error(`Campo requerido: ${key}`);
  return value;
}

function parseMoney(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? '').trim().replace(',', '.');
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Valor inválido para ${key}`);
  }
  return n;
}

function parseBoolean(formData: FormData, key: string): boolean {
  // Checkbox: if checked -> "on", else null
  return formData.get(key) === 'on';
}

export async function createProducto(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Validate inputs
  const codigo = requireNonEmpty(formData, 'codigo');
  const nombre_producto = requireNonEmpty(formData, 'nombre_producto');
  const precio = parseMoney(formData, 'precio');
  const costo = parseMoney(formData, 'costo');
  const activo = parseBoolean(formData, 'activo');

  // Insert
  const { error } = await supabase.from('productos').insert({
    codigo,
    nombre_producto,
    precio,
    costo,
    activo,
  });

  if (error) {
    // Keep it simple: throw so Next shows error overlay in dev.
    // Later: return structured errors and show them on the form.
    throw new Error(`Error insertando producto: ${error.message}`);
  }

  // Go back to list
  redirect('/productos');
}

export async function updateProducto(formData: FormData) {
  const supabase = await createClient();

  /* ---- Auth guard ---- */
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  /* ---- Required ID ---- */
  const productoId = requireNonEmpty(formData, 'producto_id');

  /* ---- Validate fields ---- */
  const codigo = requireNonEmpty(formData, 'codigo');
  const nombre_producto = requireNonEmpty(formData, 'nombre_producto');
  const precio = parseMoney(formData, 'precio');
  const costo = parseMoney(formData, 'costo');
  const activo = parseBoolean(formData, 'activo');

  /* ---- Update ---- */
  const { error } = await supabase
    .from('productos')
    .update({
      codigo,
      nombre_producto,
      precio,
      costo,
      activo,
    })
    .eq('id', productoId)
    .limit(1);

  if (error) {
    throw new Error(`Error actualizando producto: ${error.message}`);
  }

  /* ---- Redirect back to list or detail ---- */
  redirect('/productos');
}