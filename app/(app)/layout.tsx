import Link from 'next/link';
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
  const { data: empleado } = user
    ? await supabase.from('empleados').select('rol').eq('id', user.id).single()
    : { data: null };

  const rol = empleado?.rol ?? null;

  return (
    <div className="min-vh-100 text-light bg-dark" data-bs-theme="dark">
      <div className="container-fluid min-vh-100">
        <div className="row min-vh-100">
          {/* Sidebar / Top nav (responsive) */}
          <aside className="col-12 col-md-3 col-lg-2 border-end border-secondary p-3">
            <h2 className="h5 mb-3">
              <Link href="/" className="text-decoration-none text-light">
                Brave Store
              </Link>
            </h2>

            {/* On mobile: full-width top section; on md+ it becomes a sidebar */}
            <nav className="nav nav-pills flex-row flex-md-column gap-2">
              <Link href="/productos" className="nav-link px-0 text-light">
                Productos
              </Link>
              <Link href="/inventario" className="nav-link px-0 text-light">
                Inventario
              </Link>
              <Link href="/ventas" className="nav-link px-0 text-light">
                Ventas
              </Link>
              <Link href="/clientes" className="nav-link px-0 text-light">
                Clientes
              </Link>
              <Link href="/deudas" className="nav-link px-0 text-light">
                Deudas
              </Link>
              <Link href="/caja" className="nav-link px-0 text-light">
                Caja
              </Link>
              {rol === 'admin' && (
                <Link href="/admin" className="nav-link px-0 text-light">
                  Administración
                </Link>
              )}
            </nav>
          </aside>

          <main className="col-12 col-md-9 col-lg-10 p-4 bg-dark">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
