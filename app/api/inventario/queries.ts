import { createClient } from '@/lib/supabase/server';
import type { MovimientoRow } from '@/lib/utils/types';

type InventarioQueryResult = {
  data: MovimientoRow[];
  error: { message: string } | null;
};

export async function getInventarioMovimientos(): Promise<InventarioQueryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inventario')
    .select(
      `
      id,
      creado_en,
      tipo,
      cantidad_cambio,
      costo_unitario_entrada,
      referencia_venta_id,
      productos:producto_id ( id, codigo, nombre_producto ),
      empleados:empleado_id ( id, nombre )
    `,
    )
    .order('creado_en', { ascending: false })
    .limit(200);

  return {
    data: (data ?? []) as MovimientoRow[],
    error: error ? { message: error.message } : null,
  };
}
