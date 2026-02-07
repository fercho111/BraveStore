import { createClient } from '@/lib/supabase/server';
import type { CajaMovimientoRow } from '@/lib/utils/types';

type CajaQueryResult = {
  data: CajaMovimientoRow[];
  error: { message: string } | null;
};

function parseIsoDate(value: string | null): string | null {
  if (!value) return null;
  const iso = new Date(value).toISOString();
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

export async function getCajaMovimientos(
  searchParams: URLSearchParams,
): Promise<CajaQueryResult> {
  const supabase = await createClient();
  const filtroTipoRaw = searchParams.get('tipo');
  const filtroTipo: 'CARGO' | 'PAGO' | null =
    filtroTipoRaw === 'CARGO' || filtroTipoRaw === 'PAGO'
      ? filtroTipoRaw
      : null;

  const fromIso = parseIsoDate(searchParams.get('from')?.trim() ?? null);
  const toIso = parseIsoDate(searchParams.get('to')?.trim() ?? null);

  let query = supabase
    .from('caja')
    .select(
      `
      id,
      tipo,
      monto,
      medio,
      creado_en,
      clientes:cliente_id (
        id,
        nombre
      ),
      ventas:venta_id (
        id,
        total,
        pagado,
        creado_en
      ),
      empleado:empleado_id (
        id,
        nombre,
        rol
      )
    `,
    )
    .order('creado_en', { ascending: false });

  if (filtroTipo) {
    query = query.eq('tipo', filtroTipo);
  }

  if (fromIso) {
    query = query.gte('creado_en', fromIso);
  }

  if (toIso) {
    query = query.lt('creado_en', toIso);
  }

  const { data, error } = await query.limit(200);

  return {
    data: (data ?? []) as CajaMovimientoRow[],
    error: error ? { message: error.message } : null,
  };
}
