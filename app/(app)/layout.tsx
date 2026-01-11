import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: empleado } = await supabase
    .from('empleados')
    .select('rol')
    .eq('id', user.id) // id maps to auth.users.id
    .single();

  const rol = empleado?.rol ?? null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: '1rem', borderRight: '1px solid #ddd' }}>
        <h2><Link href="/">Brave Store</Link></h2>
        <nav style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
          <Link href="/productos">Productos</Link>
          <Link href="/inventario">Inventario</Link>
          <Link href="/ventas">Ventas</Link>
          <Link href="/clientes">Clientes</Link>
          <Link href="/deudas">Deudas</Link>
          <Link href="/caja">Caja</Link>
          {/* Admin-only routes */}
          {rol === 'admin' && (
            <>
              <Link href="/admin">Administración</Link>
            </>
          )}
        </nav>
      </aside>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}
