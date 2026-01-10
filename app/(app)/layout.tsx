import Link from 'next/link';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: '1rem', borderRight: '1px solid #ddd' }}>
        <h2><Link href="/">Brave Store</Link></h2>
        <nav style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
          <Link href="/productos">Productos</Link>
          <Link href="/movimientos">Movimientos</Link>
          <Link href="/ventas">Ventas</Link>
          <Link href="/clientes">Clientes</Link>
          <Link href="/deudas">Deudas</Link>
        </nav>
      </aside>
      <main style={{ padding: '1rem' }}>{children}</main>
    </div>
  );
}
