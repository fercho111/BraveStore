import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatMoney, formatDateTime } from '@/lib/utils/helpers';

type CajaMovimientoRow = {
  id: string;
  tipo: 'CARGO' | 'PAGO';
  monto: string | number;
  creado_en: string;
  clientes: {
    id: string;
    nombre: string;
  } | null;
  ventas: {
    id: string;
    total: string | number;
    pagado: string | number;
    creado_en: string;
  } | null;
  empleado: {
    id: string;
    nombre: string | null;
    rol: 'admin' | 'cajero';
  } | null;
};

export default async function CajaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Movimientos de caja (últimos 200)
  const { data, error } = await supabase
    .from('caja')
    .select(
      `
      id,
      tipo,
      monto,
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
    `
    )
    .order('creado_en', { ascending: false })
    .limit(200);

  if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Movimientos de caja</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando movimientos de caja: {error.message}
        </p>
      </main>
    );
  }

  const movimientos = (data ?? []) as unknown as CajaMovimientoRow[];

  const totalCargos = movimientos
    .filter((m) => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + Number(m.monto ?? 0), 0);

  const totalPagos = movimientos
    .filter((m) => m.tipo === 'PAGO')
    .reduce((sum, m) => sum + Number(m.monto ?? 0), 0);

  const saldo = totalCargos - totalPagos;

  return (
    <main style={{ padding: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Caja</h1>
          <p style={{ marginTop: '0.25rem', color: '#666' }}>
            Últimos {movimientos.length} movimientos
          </p>
        </div>

        <Link href="/ventas" style={{ color: '#0a58ca', textDecoration: 'none' }}>
          Ir a ventas →
        </Link>
      </header>

      {/* Resumen de saldos */}
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
            Resumen
          </h2>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            <div>
              <strong>Total cargos:</strong> {formatMoney(totalCargos)}
            </div>
            <div>
              <strong>Total pagos:</strong> {formatMoney(totalPagos)}
            </div>
            <div>
              <strong>Saldo (cargos - pagos):</strong> {formatMoney(saldo)}
            </div>
          </div>
        </div>
      </section>

      {/* Tabla de movimientos */}
      <section>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Movimientos
        </h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Venta</th>
                <th style={thStyle}>Monto</th>
                <th style={thStyle}>Empleado</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '0.75rem', color: '#666' }}>
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                movimientos.map((m) => (
                  <tr key={m.id}>
                    <td style={tdStyle}>
                      {formatDateTime(m.creado_en)}
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 999,
                          fontSize: '0.8rem',
                          border:
                            m.tipo === 'CARGO'
                              ? '1px solid #0d6efd'
                              : '1px solid #198754',
                          color: m.tipo === 'CARGO' ? '#0d6efd' : '#198754',
                        }}
                      >
                        {m.tipo === 'CARGO' ? 'Cargo' : 'Pago'}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {m.clientes ? (
                        <div>
                          <div>{m.clientes.nombre}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>

                    <td style={tdStyle}>
                      {m.ventas ? (
                        <div>
                          <Link
                            href={`/ventas/${m.ventas.id}`}
                            style={{ color: '#0a58ca', textDecoration: 'none' }}
                          >
                            Venta #{m.ventas.id.slice(0, 6)}…
                          </Link>
                          <div style={{ fontSize: '0.8rem', color: '#777' }}>
                            Total: {formatMoney(m.ventas.total)} · Pagado:{' '}
                            {formatMoney(m.ventas.pagado)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>

                    <td style={tdStyleRight}>{formatMoney(m.monto)}</td>

                    <td style={tdStyle}>
                      {m.empleado ? (
                        <div>
                          <div>{m.empleado.nombre ?? 'Sin nombre'}</div>
                          <div style={{ fontSize: '0.8rem', color: '#777' }}>
                            Rol: {m.empleado.rol}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderBottom: '1px solid #ddd',
  fontSize: '0.85rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

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
