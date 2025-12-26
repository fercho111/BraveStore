import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ProductoRow = {
  id: string;
  codigo: string;
  nombre_producto: string;
  costo: number;
  precio: number;
  activo: boolean;
  creado_en: string;
};

type PageProps = {
  params: {
    productoId: string;
  };
};

export default async function ProductoDetallePage({ params }: PageProps) {
  const supabase = await createClient();

  const datas = await params;

  const productoId = datas.productoId;

  /* ---- Fetch product ---- */
  const { data , error } = await supabase
    .from('productos')
    .select(
      'id, codigo, nombre_producto, costo, precio, activo, creado_en'
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

  return (
    <main style={{ padding: '1.5rem', maxWidth: '720px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
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
    </main>
  );
}

/* ---- Small helper components ---- */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
        padding: '0.5rem 0',
        borderBottom: '1px solid #eee',
      }}
    >
      <dt style={{ color: '#666' }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

function formatMoney(n: number) {
  return n.toFixed(2);
}
