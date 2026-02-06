'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type InventarioTipo = 'REPOSICION' | 'AJUSTE' | 'VENTA';

function asString(v: FormDataEntryValue | null): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function parseIntegerStrict(label: string, raw: string): number {
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error(`${label} debe ser un entero.`);
  return n;
}

function parseDecimal(label: string, raw: string): number {
  const n = Number(raw);
  if (Number.isNaN(n) || !Number.isFinite(n)) throw new Error(`${label} inválido.`);
  return n;
}

export async function createMovimiento(formData: FormData) {
  const supabase = await createClient();

  // -------------------------------------------------------
  // 1) Auth -> empleado_id
  // -------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const empleadoId = user.id;

  // -------------------------------------------------------
  // 2) Read inputs
  // -------------------------------------------------------
  const productoId = asString(formData.get('producto_id'));
  const tipoRaw = asString(formData.get('tipo')) as InventarioTipo;
  const cantidadRaw = asString(formData.get('cantidad'));
  const costoRaw = asString(formData.get('costo_unitario_entrada')); // optional except REPOSICION

  if (!productoId) throw new Error('Debe seleccionar un producto.');

  if (!['REPOSICION', 'AJUSTE', 'VENTA'].includes(tipoRaw)) {
    throw new Error('Tipo inválido.');
  }

  const tipo = tipoRaw;

  // Cantidad from UI is always positive (min=1), but we still validate:
  const cantidad = parseIntegerStrict('Cantidad', cantidadRaw);

  if (tipo !== 'AJUSTE' && cantidad <= 0) {
    throw new Error('Cantidad debe ser > 0.');
  }
  if (tipo === 'AJUSTE' && cantidad === 0) {
    throw new Error('AJUSTE no puede ser 0.');
  }

  // -------------------------------------------------------
  // 3) Route by tipo
  // -------------------------------------------------------
  if (tipo === 'VENTA') {
    // Important: inventory-out should be created by the sales RPC only,
    // because VENTA also implies ventas, ventas_items and caja.
    throw new Error('Las salidas por VENTA se registran desde el módulo de ventas.');
  }

  if (tipo === 'REPOSICION') {
    if (!costoRaw) {
      throw new Error('En REPOSICION debe ingresar el costo unitario.');
    }

    const costoUnitario = parseDecimal('Costo unitario', costoRaw);

    if (costoUnitario < 0) {
      throw new Error('Costo unitario no puede ser negativo.');
    }

    const { data, error } = await supabase.rpc('reponer_producto_wac', {
      p_producto_id: productoId,
      p_cantidad: cantidad,
      p_costo_unitario_entrada: costoUnitario,
      p_empleado_id: empleadoId,
    });

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    // data is movimiento_id (uuid)
    redirect('/inventario');
  }

  // tipo === 'AJUSTE'
  // Your UI currently forces cantidad >= 1. If you want negative adjustments,
  // the page should allow negatives (min not set, and helper text updated).
  // For now, we insert the cantidad as given.
  {
    const { error } = await supabase.from('inventario').insert({
      producto_id: productoId,
      tipo: 'AJUSTE',
      cantidad_cambio: cantidad, // if you later allow negative, pass negative here
      costo_unitario_entrada: null,
      empleado_id: empleadoId,
      referencia_venta_id: null,
    });

    if (error) {
      console.error(error);
      throw new Error(error.message);
    }

    redirect('/inventario');
  }
}
