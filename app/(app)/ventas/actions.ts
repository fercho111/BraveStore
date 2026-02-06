'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ItemInput = {
  productoId: string;
  cantidad: number;
};

export async function crearVenta(formData: FormData) {
  const supabase = await createClient();

  // -------------------------------------------------------
  // 1) Extract raw inputs
  // -------------------------------------------------------
  const clienteIdRaw = formData.get('clienteId') as string | null;
  const itemsRaw = formData.get('items') as string | null;
  const pagoRaw = formData.get('pagoCliente') as string | null;
  const medioRaw = formData.get('medio') as string | null;

  // -------------------------------------------------------
  // 2) Auth check (empleado_id = logged user)
  // -------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const empleadoId = user.id;

  // -------------------------------------------------------
  // 3) Parse + validate items
  // -------------------------------------------------------
  if (!itemsRaw) {
    throw new Error('No se recibieron productos.');
  }

  let parsedItems: ItemInput[];

  try {
    parsedItems = JSON.parse(itemsRaw);
  } catch {
    throw new Error('Formato inválido de productos.');
  }

  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    throw new Error('La venta debe contener al menos un producto.');
  }

  const items = parsedItems.map((i) => {
    if (!i.productoId || typeof i.productoId !== 'string') {
      throw new Error('Producto inválido.');
    }

    const cantidad = Number(i.cantidad);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new Error('Cantidad inválida.');
    }

    return {
      producto_id: i.productoId,
      cantidad,
    };
  });

  // -------------------------------------------------------
  // 4) Parse payment
  // -------------------------------------------------------
  const pagado = pagoRaw ? Number(pagoRaw) : 0;

  if (!Number.isInteger(pagado) || pagado < 0) {
    throw new Error('Pago inválido.');
  }

  // medio is required if pagado > 0
  let medio: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO' | null = null;

  if (pagado > 0) {
    if (!medioRaw) {
      throw new Error('Debe seleccionar medio de pago.');
    }

    if (!['EFECTIVO', 'TRANSFERENCIA', 'OTRO'].includes(medioRaw)) {
      throw new Error('Medio de pago inválido.');
    }

    medio = medioRaw as unknown as typeof medio;
  }

  // -------------------------------------------------------
  // 5) Cliente
  // -------------------------------------------------------
  if (!clienteIdRaw) {
    throw new Error('Cliente requerido.');
  }

  const clienteId = clienteIdRaw;

  // -------------------------------------------------------
  // 6) Call RPC
  // -------------------------------------------------------
  const { data, error } = await supabase.rpc('crear_venta', {
    p_cliente_id: clienteId,
    p_empleado_id: empleadoId,
    p_items: items,
    p_pagado: pagado,
    p_medio_pago: medio,
  });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  const ventaId = data as string;

  // -------------------------------------------------------
  // 7) Redirect to sale detail
  // -------------------------------------------------------
  redirect(`/ventas/${ventaId}`);
}
