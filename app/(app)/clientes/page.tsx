import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  celular: string;
  creado_en: string;
};

export default async function ClientesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }
  // Fetch clients (display all except id + creado_en)
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, documento, celular, creado_en')
    .order('nombre', { ascending: true });

  if (error) {
    return (
      <main style={{ padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Clientes</h1>
        <p style={{ marginTop: '1rem', color: 'crimson' }}>
          Error cargando clientes: {error.message}
        </p>
      </main>
    );
  }

  const clientes: ClienteRow[] = data ?? [];

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Clientes</h1>
          <p style={{ marginTop: '0.25rem', color: '#555' }}>
            Total: {clientes.length}
          </p>
        </div>
        {/* Later: link to /clientes/nuevo */}
        {/* <Link href="/clientes/nuevo">Nuevo cliente</Link> */}
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
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Documento</th>
              <th style={thStyle}>Celular</th>
            </tr>
          </thead>

          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '0.75rem', color: '#666' }}>
                  No hay clientes registrados.
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle}>
                    <Link
                      href={`/clientes/${c.id}`}
                      style={{ color: '#0a58ca', textDecoration: 'none' }}
                    >
                      {c.nombre}
                    </Link>
                  </td>

                  <td style={tdStyle}>{c.documento}</td>

                  <td style={tdStyle}>{c.celular}</td>
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
