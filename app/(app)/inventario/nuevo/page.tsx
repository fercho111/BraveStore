import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createMovimiento } from '../actions';
import { SubmitButton } from '../SubmitButton';


type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
};

export default async function NuevoInventarioPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    redirect('/login');
  }

  // Fetch active products for the dropdown
  const { data, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto')
    .eq('activo', true)
    .order('nombre_producto', { ascending: true });

  if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nuevo movimiento</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando productos: {error.message}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/movimientos">Volver a movimientos</Link>
        </div>
      </main>
    );
  }

  const productos: ProductoOption[] = data ?? [];

  return (
    <main style={{ padding: '1.5rem', maxWidth: 720 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nuevo movimiento</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            REPOSICION (entrada), AJUSTE (±), VENTA (salida).
          </p>
        </div>

        <Link href="/inventario">Volver</Link>
      </header>

      <form action={createMovimiento} style={{ marginTop: '1.25rem' }}>
        <div style={gridStyle}>
          <label style={labelStyle}>
            Producto
            <select name="producto_id" required style={inputStyle}>
              <option value="">Seleccione un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} — {p.nombre_producto}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Tipo
            <select name="tipo" required style={inputStyle} defaultValue="REPOSICION">
              <option value="REPOSICION">REPOSICION (entrada)</option>
              <option value="AJUSTE">AJUSTE (±)</option>
              <option value="VENTA">VENTA (salida)</option>
            </select>
          </label>

          <label style={labelStyle}>
            Cantidad
            <input
              name="cantidad"
              required
              type="number"
              // We allow any integer; server enforces rules per tipo
              defaultValue={1}
              style={inputStyle}
            />
            <span style={{ fontSize: '0.8rem', color: '#777' }}>
              REPOSICION y VENTA usan valor positivo (VENTA se registra como salida).
              AJUSTE puede ser positivo o negativo.
            </span>
          </label>

          <label style={labelStyle}>
            Costo unitario (solo para REPOSICION)
            <input
              name="costo_unitario_entrada"
              inputMode="decimal"
              placeholder="0.00"
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <SubmitButton />

          <Link href="/inventario" style={secondaryButtonStyle}>
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '0.75rem',
  marginTop: '1rem',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.7rem',
  border: '1px solid #ddd',
  borderRadius: 8,
  fontWeight: 400,
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 0.9rem',
  borderRadius: 8,
  border: '1px solid #222',
  background: '#222',
  color: '#fff',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 0.9rem',
  borderRadius: 8,
  border: '1px solid #ddd',
  color: '#222',
  textDecoration: 'none',
};
