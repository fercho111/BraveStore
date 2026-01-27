// app/clientes/nuevo/page.tsx

import Link from 'next/link';
import { createCliente } from '../actions';

export default function NuevoClientePage() {
  return (
    <>
      <header className="d-flex justify-content-between align-items-baseline gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="h4 fw-semibold mb-1">Nuevo cliente</h1>
          <p className="text-muted mb-0">
            Registrar un cliente para gestionar deudas y pagos.
          </p>
        </div>

        <Link href="/clientes" className="btn btn-outline-light btn-sm">
          Volver
        </Link>
      </header>

      <form action={createCliente} className="mt-2" style={{ maxWidth: 720 }}>
        <div className="row g-3">
          {/* Nombre */}
          <div className="col-12">
            <label htmlFor="nombre" className="form-label">
              Nombre completo
            </label>
            <input
              id="nombre"
              name="nombre"
              required
              className="form-control"
              placeholder="Nombre y apellido"
            />
          </div>

          {/* Documento */}
          <div className="col-12 col-md-6">
            <label htmlFor="documento" className="form-label">
              Documento (cédula / ID)
            </label>
            <input
              id="documento"
              name="documento"
              className="form-control"
              placeholder="Opcional"
            />
            <div className="form-text">
              Si se llena, debe ser único.
            </div>
          </div>

          {/* Celular */}
          <div className="col-12 col-md-6">
            <label htmlFor="celular" className="form-label">
              Celular
            </label>
            <input
              id="celular"
              name="celular"
              className="form-control"
              placeholder="Opcional"
            />
          </div>

          {/* Género */}
          <div className="col-12 col-md-6">
            <label htmlFor="genero" className="form-label">
              Género
            </label>
            <select
              id="genero"
              name="genero"
              className="form-select"
              defaultValue=""
            >
              <option value="">No especificar</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMENINO">Femenino</option>
              <option value="OTRO">Otro</option>
              <option value="NO_INFORMA">No informa</option>
            </select>
          </div>

          {/* Grupo de edad */}
          <div className="col-12 col-md-6">
            <label htmlFor="grupo_edad" className="form-label">
              Grupo de edad
            </label>
            <select
              id="grupo_edad"
              name="grupo_edad"
              className="form-select"
              defaultValue=""
            >
              <option value="">No especificar</option>
              <option value="MENOR_18">Menor de 18</option>
              <option value="ED_18_25">18–25</option>
              <option value="ED_26_35">26–35</option>
              <option value="ED_36_45">36–45</option>
              <option value="ED_46_60">46–60</option>
              <option value="MAYOR_60">Mayor de 60</option>
            </select>
          </div>
        </div>

        <div className="mt-3 d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm">
            Guardar
          </button>

          <Link href="/clientes" className="btn btn-outline-light btn-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
