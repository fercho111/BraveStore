// app/(app)/productos/[productoId]/editar/page.tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { updateProducto } from '../../actions';

type PageProps = {
  params: { productoId: string };
};

export default async function EditarProductoPage({ params }: PageProps) {
  const supabase = await createClient();

  const data = await params;

  const productoId = data.productoId;

  // Fetch product
  const { data: producto, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, costo, precio, activo')
    .eq('id', productoId)
    .single();

  if (error || !producto) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Editar producto</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          No se pudo cargar el producto. {error?.message ?? ''}
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/productos">Volver a productos</Link>
        </div>
      </main>
    );
  }

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Editar producto</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            {producto.nombre_producto} ({producto.codigo})
          </p>
        </div>

        <Link href={`/productos/${productoId}`}>Volver</Link>
      </header>

      <form action={updateProducto} style={{ marginTop: '1.25rem' }}>
        {/* Important: pass the id explicitly to the server action */}
        <input type="hidden" name="producto_id" value={producto.id} />

        <div style={gridStyle}>
          <label style={labelStyle}>
            Código (SKU)
            <input
              name="codigo"
              required
              defaultValue={producto.codigo ?? ''}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Producto
            <input
              name="nombre_producto"
              required
              defaultValue={producto.nombre_producto ?? ''}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Precio (venta)
            <input
              name="precio"
              required
              inputMode="decimal"
              defaultValue={String(producto.precio ?? '')}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Costo (promedio)
            <input
              name="costo"
              required
              inputMode="decimal"
              defaultValue={String(producto.costo ?? '')}
              style={inputStyle}
            />
          </label>

          <label
            style={{
              ...labelStyle,
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <input name="activo" type="checkbox" defaultChecked={!!producto.activo} />
            Activo
          </label>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={buttonStyle}>
            Guardar cambios
          </button>

          <Link href={`/productos/${productoId}`} style={secondaryButtonStyle}>
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
