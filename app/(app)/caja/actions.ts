'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type CajaTipo = 'CARGO' | 'PAGO';
type MedioPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

function readString(formData: FormData, key: string): string {
  const v = formData.get(key);
  if (typeof v !== 'string') return '';
  return v.trim();
}

function isCajaTipo(x: string): x is CajaTipo {
  return x === 'CARGO' || x === 'PAGO';
}

function isMedioPago(x: string): x is MedioPago {
  return x === 'EFECTIVO' || x === 'TRANSFERENCIA' || x === 'OTRO';
}

function parseMonto(raw: string): number {
  // Allow "12000", "12000.00", "12,000.00" (optional), and trim spaces
  const normalized = raw.replace(/,/g, '').trim();
  const n = Number(normalized);
  return n;
}

// Lightweight UUID format check (debug-friendly; DB still enforces)
function looksLikeUuid(x: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    x,
  );
}

/**
 * Crea un movimiento en caja.
 * - cliente_id: required UUID
 * - tipo: CARGO | PAGO
 * - monto: numeric > 0
 * - venta_id: optional UUID
 * - medio: required if tipo=PAGO; must be empty/null if tipo=CARGO
 */
export async function crearMovimientoCaja(formData: FormData) {
  const supabase = await createClient();

  // 1) Auth + empleado_id
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    // In server actions, redirect is simplest
    redirect('/login');
  }

  const empleadoId = user.id;

  // 2) Read raw form values (explicit)
  const clienteIdRaw = readString(formData, 'cliente_id');
  const tipoRaw = readString(formData, 'tipo');
  const montoRaw = readString(formData, 'monto');
  const medioRaw = readString(formData, 'medio'); // may be '' (meaning null)

  // 3) Validate cliente_id
  if (!clienteIdRaw) {
    throw new Error('cliente_id es requerido.');
  }
  if (!looksLikeUuid(clienteIdRaw)) {
    throw new Error(`cliente_id no parece UUID válido: "${clienteIdRaw}"`);
  }

  // 4) Validate tipo
  if (!isCajaTipo(tipoRaw)) {
    throw new Error(`tipo inválido: "${tipoRaw}". Debe ser CARGO o PAGO.`);
  }
  const tipo: CajaTipo = tipoRaw;

  // 5) Validate monto
  if (!montoRaw) {
    throw new Error('monto es requerido.');
  }
  const monto = parseMonto(montoRaw);
  if (!Number.isFinite(monto)) {
    throw new Error(`monto inválido: "${montoRaw}".`);
  }
  if (monto <= 0) {
    throw new Error(`monto debe ser > 0. Recibido: ${monto}`);
  }

  // Optional: enforce 2 decimals max (since numeric(12,2))
  // This is not strictly required (Postgres will round/throw depending),
  // but it helps catch mistakes early.
  const montoCents = Math.round(monto * 100);
  if (Math.abs(montoCents / 100 - monto) > 1e-9) {
    // This detects floating weirdness; not perfect but useful.
    // You can remove if annoying.
  }


  // 7) Validate medio depending on tipo (respect DB constraint)
  let medio: MedioPago | null = null;

  if (tipo === 'PAGO') {
    if (!medioRaw) {
      throw new Error('medio es requerido cuando tipo = PAGO.');
    }
    if (!isMedioPago(medioRaw)) {
      throw new Error(
        `medio inválido: "${medioRaw}". Debe ser EFECTIVO, TRANSFERENCIA u OTRO.`,
      );
    }
    medio = medioRaw;
  } else {
    // tipo === 'CARGO'
    // We enforce medio = null even if the user submitted something
    medio = null;
  }

  // 8) Insert explicitly
  const insertPayload = {
    cliente_id: clienteIdRaw,
    tipo,
    monto,
    empleado_id: empleadoId,
    medio, // null for CARGO, enum for PAGO
  };

  const { error: insertError } = await supabase.from('caja').insert(insertPayload);

  if (insertError) {
    console.error('Error insertando en caja:', {
      insertPayload,
      insertError,
    });
    throw new Error(`No se pudo crear el movimiento de caja: ${insertError.message}`);
  }

  // 9) Go back
  redirect('/caja');
}
