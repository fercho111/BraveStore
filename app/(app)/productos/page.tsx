import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

type ProductoRow = {
  id: string;
  codigo: string;
  nombre_producto: string;
  costo: string | number;
  precio: string | number;
  activo: boolean;
  creado_en: string;
};

export default async function ProductosPage() {
  const supabase = await createClient();

  // Fetch products (display all except id + creado_en)
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, costo, precio, activo, creado_en')
    .order('nombre_producto', { ascending: true });

  if (error) {
    // For now: render an error page section (no fancy error boundary yet)
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Productos</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando productos: {error.message}
        </p>
      </main>
    );
  }

  const productos: ProductoRow[] = data ?? [];

  return (
    <main style={{ padding: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Productos</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Total: {productos.length}
          </p>
        </div>
        {/* Later: link to /productos/nuevo */}
        {/* <Link href="/productos/nuevo">Nuevo producto</Link> */}
      </header>

      <div style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '720px',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Código</th>
              <th style={thStyle}>Producto</th>
              <th style={thStyle}>Costo</th>
              <th style={thStyle}>Precio</th>
              <th style={thStyle}>Activo</th>
            </tr>
          </thead>

          <tbody>
            {productos.length === 0 ? (
                <tr>
                <td colSpan={5} style={{ padding: '0.75rem', color: '#666' }}>
                    No hay productos registrados.
                </td>
                </tr>
            ) : (
                productos.map((p) => (
                <tr key={p.id}>
                    <td style={tdStyle}>
                    <Link
                        href={`/productos/${p.id}`}
                        style={{ color: '#0a58ca', textDecoration: 'none' }}
                    >
                        {p.codigo}
                    </Link>
                    </td>

                    <td style={tdStyle}>
                    <Link
                        href={`/productos/${p.id}`}
                        style={{ color: '#0a58ca', textDecoration: 'none' }}
                    >
                        {p.nombre_producto}
                    </Link>
                    </td>

                    <td style={tdStyleRight}>{formatMoney(p.costo)}</td>

                    <td style={tdStyleRight}>{formatMoney(p.precio)}</td>

                    <td style={tdStyle}>
                    <span
                        style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 999,
                        fontSize: '0.85rem',
                        border: '1px solid #ddd',
                        background: p.activo ? '#f5fff7' : '#fff5f5',
                        }}
                    >
                        {p.activo ? 'Sí' : 'No'}
                    </span>
                    </td>
                </tr>
                ))
            )}
            </tbody>


        </table>
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  fontWeight: 600,
  padding: '0.75rem',
  borderBottom: '1px solid #ddd',
  background: '#fafafa',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid #eee',
  verticalAlign: 'top',
};

const tdStyleRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
};

function formatMoney(value: string | number) {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);

  // Keep it simple; later you can localize (es-CO) if desired
  return n.toFixed(2);
}
