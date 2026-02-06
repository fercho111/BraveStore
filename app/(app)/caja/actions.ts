// app/caja/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function asString(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : '';
}

function parseDecimalStrict(label: string, raw: string): number {
  // Accept "12000", "12000.00", "0.50"
  const n = Number(raw);
  if (!Number.isFinite(n) || Number.isNaN(n)) throw new Error(`${label} inválido.`);
  return n;
}

export async function crearMovimientoCaja(formData: FormData) {
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
  // 2) Read inputs (UI now only supports PAGO)
  // -------------------------------------------------------
  const clienteId = asString(formData.get('cliente_id'));
  const tipo = asString(formData.get('tipo')); // should be "PAGO"
  const montoRaw = asString(formData.get('monto'));
  const medioRaw = asString(formData.get('medio'));

  if (!clienteId) throw new Error('Debe seleccionar un cliente.');

  if (tipo !== 'PAGO') {
    throw new Error('Tipo inválido. Esta pantalla solo registra PAGO.');
  }

  if (!montoRaw) throw new Error('Debe ingresar un monto.');
  const monto = parseDecimalStrict('Monto', montoRaw);

  if (monto <= 0) throw new Error('El monto debe ser > 0.');

  if (!medioRaw) throw new Error('Debe seleccionar un medio de pago.');
  if (!['EFECTIVO', 'TRANSFERENCIA', 'OTRO'].includes(medioRaw)) {
    throw new Error('Medio de pago inválido.');
  }

  const medio = medioRaw as 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

  // -------------------------------------------------------
  // 3) Call RPC: registrar_movimiento_caja
  // -------------------------------------------------------
  const { data, error } = await supabase.rpc('registrar_movimiento_caja', {
    p_cliente_id: clienteId,
    p_tipo: 'PAGO',
    p_monto: monto,
    p_empleado_id: empleadoId,
    p_medio: medio,
    p_venta_id: null,
  });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  // data is movement id (uuid) if you ever want it for debugging
  redirect('/caja');
}
