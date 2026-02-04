import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductoRow, InventarioRow, KardexRow } from '@/lib/utils/types';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';

type PageProps = {
  params: {
    productoId: string;
  };
};

export default async function ProductoDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { productoId } = await params;

  const { data, error } = await supabase
    .from('productos')
    .select(
      `id,
      codigo,
      nombre_producto,
      costo,
      precio,
      activo,
      creado_en
      `
    )
    .eq('id', productoId)
    .single();

  if (error) {
    // If the ID is valid format but not found
    if (error.code === 'PGRST116') {
      notFound();
    }
    throw new Error(`Error cargando producto: ${error.message}`);
  }

  const producto: ProductoRow = data;

  const { data: inventarioData, error: inventarioError } = await supabase
    .from('inventario')
    .select(
      `id,
      tipo,
      cantidad_cambio,
      costo_unitario_entrada,
      referencia_venta_id,
      creado_en
      `
    )
    .eq('producto_id', productoId)
    .order('creado_en', { ascending: true })
    .order('id', { ascending: true });

  if (inventarioError) {
    console.error('Error cargando inventario:', inventarioError.message);
  }

  const inventarioMovimientos: InventarioRow[] = inventarioData ?? [];
  const kardexRows: KardexRow[] = buildKardex(inventarioMovimientos);

  return (
    <>
      <h1 className="mb-4">{producto.nombre_producto}</h1>

      {/* Detalle del producto */}
      <section>
        <dl className="row">
          <dt className="col-sm-3">Código</dt>
          <dd className="col-sm-9">{producto.codigo}</dd>

          <dt className="col-sm-3">Costo</dt>
          <dd className="col-sm-9">{formatMoney(producto.costo)}</dd>

          <dt className="col-sm-3">Precio</dt>
          <dd className="col-sm-9">{formatMoney(producto.precio)}</dd>

          <dt className="col-sm-3">Activo</dt>
          <dd className="col-sm-9">
            {producto.activo ? (
              <span className="badge bg-success-subtle border border-success-subtle text-success">
                Sí
              </span>
            ) : (
              <span className="badge bg-danger-subtle border border-danger-subtle text-danger">
                No
              </span>
            )}
          </dd>

          <dt className="col-sm-3">Creado</dt>
          <dd className="col-sm-9">{formatDateTime(producto.creado_en)}</dd>
        </dl>
      </section>

      {/* Kardex / Movimientos de inventario */}
      <section className="mt-4">
        <h2 className="h4 mb-3">Movimientos de inventario (Kardex)</h2>

        {kardexRows.length === 0 ? (
          <p className="text-muted">
            No hay movimientos de inventario para este producto.
          </p>
        ) : (
          <InventarioKardexTable rows={kardexRows} />
        )}
      </section>
    </>
  );
}

/* ---- Tabla de Kardex con Bootstrap puro ---- */

function InventarioKardexTable({ rows }: { rows: KardexRow[] }) {
  return (
    <div className="table-responsive">
      <table className="table table-dark table-striped table-hover align-middle">
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Tipo</th>
            <th scope="col" className="text-end">
              Entrada
            </th>
            <th scope="col" className="text-end">
              Salida
            </th>
            <th scope="col" className="text-end">
              Saldo unidades
            </th>
            <th scope="col" className="text-end">
              Costo promedio
            </th>
            <th scope="col" className="text-end">
              Saldo costo total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{formatDateTime(r.fecha)}</td>
              <td>{r.tipo}</td>
              <td className="text-end">{r.entrada !== 0 ? r.entrada : ''}</td>
              <td className="text-end">{r.salida !== 0 ? r.salida : ''}</td>
              <td className="text-end">{r.saldoUnidades}</td>
              <td className="text-end">{formatMoney(r.costoPromedio)}</td>
              <td className="text-end">{formatMoney(r.saldoCostoTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Construye el kardex (saldo unidades, costo promedio, saldo costo total)
 * a partir de los movimientos crudos de inventario.
 */
function buildKardex(rows: InventarioRow[]): KardexRow[] {
  let saldoUnidades = 0;
  let costoPromedio = 0; // costo promedio ponderado
  let saldoCostoTotal = 0; // saldoUnidades * costoPromedio

  const result: KardexRow[] = [];

  for (const row of rows) {
    const tipo = row.tipo;
    const cantidadCambio = Number(row.cantidad_cambio);
    const costoEntrada =
      row.costo_unitario_entrada != null
        ? Number(row.costo_unitario_entrada)
        : 0;

    let entrada = 0;
    let salida = 0;

    if (tipo === 'REPOSICION') {
      // entrada (cantidad_cambio debe ser > 0)
      entrada = cantidadCambio;

      const totalOld = saldoCostoTotal;
      const totalNew = totalOld + entrada * costoEntrada;
      const unidadesNew = saldoUnidades + entrada;

      saldoUnidades = unidadesNew;
      saldoCostoTotal = totalNew;
      costoPromedio = unidadesNew > 0 ? totalNew / unidadesNew : 0;
    } else if (tipo === 'VENTA') {
      // salida (cantidad_cambio suele ser negativa)
      salida = Math.abs(cantidadCambio);

      // costo promedio NO cambia en WAC, solo baja el total
      saldoUnidades = saldoUnidades - salida;
      saldoCostoTotal = saldoUnidades * costoPromedio;
    } else if (tipo === 'AJUSTE') {
      if (cantidadCambio > 0) {
        // ajuste como entrada al costo promedio actual
        entrada = cantidadCambio;
        const totalNew = saldoCostoTotal + entrada * costoPromedio;
        const unidadesNew = saldoUnidades + entrada;

        saldoUnidades = unidadesNew;
        saldoCostoTotal = totalNew;
        costoPromedio = unidadesNew > 0 ? totalNew / unidadesNew : 0;
      } else {
        // ajuste como salida al costo promedio actual
        salida = Math.abs(cantidadCambio);
        saldoUnidades = saldoUnidades - salida;
        saldoCostoTotal = saldoUnidades * costoPromedio;
      }
    }

    result.push({
      id: row.id,
      fecha: row.creado_en,
      tipo,
      entrada,
      salida,
      saldoUnidades,
      costoPromedio,
      saldoCostoTotal,
    });
  }

  return result;
}
