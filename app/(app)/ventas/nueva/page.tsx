import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createVenta } from '../actions';
import LineItems from './LineItems';

type ProductoOption = {
  id: string;
  codigo: string;
  nombre_producto: string;
  precio: number;
};

export default async function NuevaVentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Cargar productos activos para el selector
  const { data: productosData, error } = await supabase
    .from('productos')
    .select('id, codigo, nombre_producto, precio')
    .eq('activo', true)
    .order('nombre_producto', { ascending: true });

  if (error) {
    throw new Error(`Error cargando productos: ${error.message}`);
  }

  const productos: ProductoOption[] = productosData ?? [];

  return (
    <main style={{ padding: '1.5rem' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nueva venta</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Registrar una venta seleccionando productos y cantidades.
          </p>
        </div>

        <Link href="/ventas" style={{ alignSelf: 'center' }}>
          Volver
        </Link>
      </header>

      {/* 
        IMPORTANTE:
        El server action createVenta recibirá:
        - producto_ids[]: string[]
        - cantidades[]:   string[] (parsear a número)
      */}
      <form action={createVenta} style={{ marginTop: '1.25rem' }}>
        {/* Aquí más adelante puede ir cliente, nota, etc. */}

        <section
          style={{
            border: '1px solid #eee',
            borderRadius: 8,
            padding: '0.75rem',
          }}
        >
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
            }}
          >
            Productos de la venta
          </h2>

          <LineItems productos={productos} />
        </section>

        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          <button type="submit" style={buttonStyle}>
            Guardar venta
          </button>

          <Link href="/ventas" style={secondaryButtonStyle}>
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}

/* ---- Reutilizar estilos básicos ---- */

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
