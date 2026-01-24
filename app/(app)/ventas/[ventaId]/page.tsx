// app/ventas/[ventaId]/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { VentaRow, ClienteRow } from '@/lib/utils/types';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';

type VentaDbRow = VentaRow & {
  empleado_id: string;
  cliente_id: string | null;
  nota: string | null;
};

type EmpleadoRow = {
  id: string;
  nombre: string | null;
};

type VentaItemRow = {
  id: string;
  cantidad: number;
  precio_unitario: string | number;
  costo_unitario: string | number;
  productos: {
    id: string;
    codigo: string;
    nombre_producto: string;
  } | null;
};

type PageProps = {
  params: { ventaId: string };
};

export default async function VentaDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  // Require auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const datas = await params;

  const ventaId = datas.ventaId;

  // 1) Fetch venta base data
  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .select('id, total, pagado, creado_en, empleado_id, cliente_id, nota')
    .eq('id', ventaId)
    .single();

  if (ventaError || !ventaData) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Venta</h1>
            <p style={{ marginTop: '0.25rem', color: '#666' }}>{ventaId}</p>
          </div>
          <Link href="/ventas" style={{ color: '#0a58ca' }}>
            ← Volver a ventas
          </Link>
        </header>

        <p style={{ color: 'crimson' }}>
          Error cargando venta: {ventaError?.message ?? 'Venta no encontrada.'}
        </p>
      </main>
    );
  }

  const venta = ventaData as VentaDbRow;

  // 2) Fetch empleado
  const { data: empleadoData } = await supabase
    .from('empleados')
    .select('id, nombre')
    .eq('id', venta.empleado_id)
    .single();

  const empleado = (empleadoData || null) as EmpleadoRow | null;

  // 3) Fetch cliente (si existe)
  let cliente: ClienteRow | null = null;

  if (venta.cliente_id) {
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('id, nombre, documento, celular, creado_en')
      .eq('id', venta.cliente_id)
      .single();

    cliente = (clienteData || null) as ClienteRow | null;
  }

  // 4) Fetch ítems de la venta + producto
  const { data: itemsData, error: itemsError } = await supabase
    .from('ventas_items')
    .select(
      `
      id,
      cantidad,
      precio_unitario,
      costo_unitario,
      productos:producto_id (
        id,
        codigo,
        nombre_producto
      )
    `
    )
    .eq('venta_id', ventaId)
    .order('id', { ascending: true });

  const items = (itemsData ?? []) as unknown as VentaItemRow[];

  const totalNumero = Number(venta.total ?? 0);
  const pagadoNumero = Number(venta.pagado ?? 0);
  const saldoNumero = totalNumero - pagadoNumero;

  return (
    <main>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Detalle de venta</h1>
          <p style={{ marginTop: '0.25rem', color: '#666' }}>ID: {venta.id}</p>
        </div>

        <Link href="/ventas" style={{ color: '#0a58ca', textDecoration: 'none' }}>
          ← Volver a ventas
        </Link>
      </header>

      {/* Info principal de la venta */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: '0.75rem 1rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Información general
          </h2>
          <div style={{ fontSize: '0.9rem' }}>
            <div>
              <strong>Fecha:</strong>{' '}
              {venta.creado_en ? formatDateTime(venta.creado_en) : '—'}
            </div>
            <div>
              <strong>Empleado:</strong>{' '}
              {empleado?.nombre || '—'}
            </div>
            {cliente && (
              <div>
                <strong>Cliente:</strong>{' '}
                {cliente.nombre}
                {cliente.documento ? ` (${cliente.documento})` : ''}
              </div>
            )}
            {venta.nota && (
              <div style={{ marginTop: '0.25rem' }}>
                <strong>Nota:</strong> {venta.nota}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: '0.75rem 1rem',
          }}
        >
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Totales
          </h2>
          <div style={{ fontSize: '0.9rem' }}>
            <div>
              <strong>Total:</strong> {formatMoney(venta.total ?? 0)}
            </div>
            <div>
              <strong>Pagado:</strong> {formatMoney(venta.pagado ?? 0)}
            </div>
            <div>
              <strong>Saldo:</strong> {formatMoney(saldoNumero)}
            </div>
          </div>
        </div>
      </section>

      {/* Ítems de la venta */}
      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Ítems de la venta
        </h2>

        {itemsError && (
          <p style={{ color: 'crimson', marginBottom: '0.75rem' }}>
            Error cargando ítems: {itemsError.message}
          </p>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
                <th>Costo unitario</th>
                <th>Costo total</th>
                <th>Margen</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '0.75rem', color: '#666' }}>
                    No hay ítems registrados para esta venta.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const precio = Number(item.precio_unitario ?? 0);
                  const costo = Number(item.costo_unitario ?? 0);
                  const subtotal = precio * item.cantidad;
                  const costoTotal = costo * item.cantidad;
                  const margen = subtotal - costoTotal;

                  return (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        {item.productos ? (
                          <>
                            <div style={{ fontWeight: 500 }}>
                              {item.productos.nombre_producto}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#777' }}>
                              {item.productos.codigo}
                            </div>
                          </>
                        ) : (
                          'Producto eliminado'
                        )}
                      </td>
                      <td style={tdStyleRight}>{item.cantidad}</td>
                      <td style={tdStyleRight}>{formatMoney(item.precio_unitario)}</td>
                      <td style={tdStyleRight}>{formatMoney(subtotal)}</td>
                      <td style={tdStyleRight}>{formatMoney(item.costo_unitario)}</td>
                      <td style={tdStyleRight}>{formatMoney(costoTotal)}</td>
                      <td style={tdStyleRight}>{formatMoney(margen)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
  fontSize: '0.9rem',
};

const tdStyleRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'left',
  fontVariantNumeric: 'tabular-nums',
};
