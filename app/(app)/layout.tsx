import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: '1rem', borderRight: '1px solid #ddd' }}>
        <h2>Brave Store</h2>
        <nav style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
          <a href="/productos">Productos</a>
          <a href="/inventario">Inventario</a>
          <a href="/ventas">Ventas</a>
          <a href="/clientes">Clientes</a>
          <a href="/deudas">Deudas</a>
        </nav>
      </aside>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}
