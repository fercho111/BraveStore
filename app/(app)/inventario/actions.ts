'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function requireNonEmpty(formData: FormData, key: string): string {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) throw new Error(`Campo requerido: ${key}`);
  return value;
}

function parseIntAllowSign(formData: FormData, key: string): number {
  const raw = String(formData.get(key) ?? '').trim();
  const n = Number(raw);
  if (!Number.isInteger(n)) {
    throw new Error(`Cantidad inválida para ${key}`);
  }
  return n;
}

function parseMoney(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? '').trim();
  if (!raw) return null; // allow empty
  const normalized = raw.replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Valor inválido para ${key}`);
  }
  return n;
}

export async function createMovimiento(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    redirect('/login');
  }

  const userId = user.id;

  // Basic fields
  const producto_id = requireNonEmpty(formData, 'producto_id');
  const tipoRaw = requireNonEmpty(formData, 'tipo') as
    | 'REPOSICION'
    | 'AJUSTE'
    | 'VENTA';

  if (!['REPOSICION', 'AJUSTE', 'VENTA'].includes(tipoRaw)) {
    throw new Error('Tipo de movimiento inválido');
  }

  const cantidadInput = parseIntAllowSign(formData, 'cantidad');
  const costo_unitario_entrada_raw = parseMoney(formData, 'costo_unitario_entrada');

  let cantidad_cambio: number;
  let costo_unitario_entrada: number | null = null;

  if (tipoRaw === 'REPOSICION') {
    // Only positive quantities allowed
    if (cantidadInput <= 0) {
      throw new Error('La cantidad para REPOSICION debe ser mayor que 0.');
    }
    cantidad_cambio = cantidadInput; // positive
    costo_unitario_entrada = costo_unitario_entrada_raw;
  } else if (tipoRaw === 'AJUSTE') {
    // Can be positive or negative, but not zero
    if (cantidadInput === 0) {
      throw new Error('La cantidad para AJUSTE no puede ser 0.');
    }
    cantidad_cambio = cantidadInput;
    // cost not relevant for ajustes in WAC model
    costo_unitario_entrada = null;
  } else {
    // VENTA
    // User types a positive quantity; we store it as negative to respect the DB CHECK
    if (cantidadInput <= 0) {
      throw new Error('La cantidad para VENTA debe ser mayor que 0.');
    }
    cantidad_cambio = -Math.abs(cantidadInput);
    costo_unitario_entrada = null;
  }

  const { error } = await supabase.from('inventario').insert({
    producto_id,
    tipo: tipoRaw,
    cantidad_cambio,
    costo_unitario_entrada,
    empleado_id: userId,
  });

  if (error) {
    throw new Error(`Error creando movimiento de inventario: ${error.message}`);
  }

  // TODO (futuro): actualizar productos.costo (WAC) en caso de REPOSICION

  redirect('/inventario');
}