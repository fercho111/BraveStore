// app/caja/nuevo/page.tsx

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { crearMovimientoCaja } from '../actions';

type ClienteOption = {
  id: string;
  nombre: string;
  documento: string | null;
};

export default async function CajaNuevoPage() {
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch clients for dropdown
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nombre, documento')
    .order('nombre', { ascending: true });

  if (error) {
    return (
      <>
        <h1 className="h4 fw-semibold mb-2">Nuevo movimiento de caja</h1>
        <div className="alert alert-danger" role="alert">
          Error cargando clientes: {error.message}
        </div>
        <Link href="/caja" className="btn btn-outline-light btn-sm">
          Volver a caja
        </Link>
      </>
    );
  }

  const clientes: ClienteOption[] = data ?? [];

  return (
    <>
      <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-3 mb-3">
        <div>
          <h1 className="h4 fw-semibold mb-1">Nuevo movimiento de caja</h1>
          <p className="text-muted mb-0">
            CARGO crea deuda. PAGO registra abono (requiere medio).
          </p>
        </div>

        <Link href="/caja" className="btn btn-outline-light btn-sm">
          Volver
        </Link>
      </header>

      <form action={crearMovimientoCaja} style={{ maxWidth: 720 }}>
        <div className="row g-3">
          {/* Cliente */}
          <div className="col-12">
            <label className="form-label">Cliente</label>
            <select name="cliente_id" className="form-select" required defaultValue="">
              <option value="" disabled>
                Seleccione un cliente
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.documento ? ` — ${c.documento}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo */}
          <div className="col-12 col-md-6">
            <label className="form-label">Tipo</label>
            <select
              name="tipo"
              className="form-select"
              required
              defaultValue="PAGO"
              aria-describedby="tipoHelp"
            >
              <option value="PAGO">PAGO</option>
              <option value="CARGO">CARGO</option>
            </select>
            <div id="tipoHelp" className="form-text">
              Si es PAGO, debe elegir un medio. Si es CARGO, el medio debe quedar vacío.
            </div>
          </div>

          {/* Monto */}
          <div className="col-12 col-md-6">
            <label className="form-label">Monto</label>
            <input
              name="monto"
              className="form-control"
              required
              inputMode="decimal"
              placeholder="0.00"
              aria-describedby="montoHelp"
            />
            <div id="montoHelp" className="form-text">
              Valor positivo (ej: 12000 o 12000.00).
            </div>
          </div>

          {/* Medio (solo aplica a PAGO; por ahora lo dejamos siempre visible) */}
          <div className="col-12 col-md-6">
            <label className="form-label">Medio (solo PAGO)</label>
            <select name="medio" className="form-select" defaultValue="">
              <option value="">—</option>
              <option value="EFECTIVO">EFECTIVO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="OTRO">OTRO</option>
            </select>
          </div>

        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar
          </button>

          <Link href="/caja" className="btn btn-outline-light btn-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
