import Link from 'next/link';
import { createProducto } from '../actions';

export default function NuevoProductoPage() {
  return (
    <main style={{ padding: '1.5rem', maxWidth: 720 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nuevo producto</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Crear un producto en el inventario.
          </p>
        </div>

        <Link href="/productos" style={{ alignSelf: 'center' }}>
          Volver
        </Link>
      </header>

      <form action={createProducto} style={{ marginTop: '1.25rem' }}>
        <div style={gridStyle}>
          <label style={labelStyle}>
            Código (SKU)
            <input name="codigo" required placeholder="PR-001" style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Producto
            <input
              name="nombre_producto"
              required
              placeholder="Proteína 2lb"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Precio (venta)
            <input
              name="precio"
              required
              inputMode="decimal"
              placeholder="0.00"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Costo (promedio inicial)
            <input
              name="costo"
              required
              inputMode="decimal"
              placeholder="0.00"
              style={inputStyle}
            />
          </label>

          <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
            <input name="activo" type="checkbox" defaultChecked />
            Activo
          </label>
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={buttonStyle}>
            Guardar
          </button>

          <Link href="/productos" style={secondaryButtonStyle}>
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
