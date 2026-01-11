import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProductoRow, InventarioRow, KardexRow } from '@/lib/utils/types';
import { Row } from '@/components/Row';
import { Td } from '@/components/Td';
import { Th } from '@/components/Th';
import { formatMoney } from '@/lib/utils/helpers';

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

  const datas = await params;

  const productoId = datas.productoId;

  const { data , error } = await supabase
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
      nota,
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
    <main>
      <h1>
        {producto.nombre_producto}
      </h1>

      <dl style={{ marginTop: '1rem' }}>
        <Row label="Código" value={producto.codigo} />
        <Row label="Costo" value={formatMoney(producto.costo)} />
        <Row label="Precio" value={formatMoney(producto.precio)} />
        <Row
          label="Activo"
          value={producto.activo ? 'Sí' : 'No'}
        />
        <Row
          label="Creado"
          value={new Date(producto.creado_en).toLocaleString()}
        />
      </dl>
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Movimientos de inventario (Kardex)
        </h2>

        {kardexRows.length === 0 ? (
          <p style={{ color: '#666' }}>
            No hay movimientos de inventario para este producto.
          </p>
        ) : (
          <InventarioKardexTable rows={kardexRows} />
        )}
      </section>

    </main>
  );
}

/* ---- Small helper components ---- */

function InventarioKardexTable({ rows }: { rows: KardexRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
        }}
      >
        <thead>
          <tr>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th style={{ textAlign: 'right' }}>Entrada</Th>
            <Th style={{ textAlign: 'right' }}>Salida</Th>
            <Th style={{ textAlign: 'right' }}>Saldo unidades</Th>
            <Th style={{ textAlign: 'right' }}>Costo promedio</Th>
            <Th style={{ textAlign: 'right' }}>Saldo costo total</Th>
            <Th>Nota</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <Td>{new Date(r.fecha).toLocaleString()}</Td>
              <Td>{r.tipo}</Td>
              <Td style={{ textAlign: 'right' }}>
                {r.entrada !== 0 ? r.entrada : ''}
              </Td>
              <Td style={{ textAlign: 'right' }}>
                {r.salida !== 0 ? r.salida : ''}
              </Td>
              <Td style={{ textAlign: 'right' }}>{r.saldoUnidades}</Td>
              <Td style={{ textAlign: 'right' }}>{formatMoney(r.costoPromedio)}</Td>
              <Td style={{ textAlign: 'right' }}>{formatMoney(r.saldoCostoTotal)}</Td>
              <Td>{r.nota ?? ''}</Td>
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
  let costoPromedio = 0;      // costo promedio ponderado
  let saldoCostoTotal = 0;    // saldoUnidades * costoPromedio

  const result: KardexRow[] = [];

  for (const row of rows) {
    const tipo = row.tipo;
    const cantidadCambio = Number(row.cantidad_cambio);
    const costoEntrada = row.costo_unitario_entrada != null
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
      nota: row.nota,
    });
  }

  return result;
}
