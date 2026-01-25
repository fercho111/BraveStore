export type MovimientoRow = {
  id: string;
  creado_en: string;
  tipo: 'REPOSICION' | 'VENTA' | 'AJUSTE';
  cantidad_cambio: number;
  costo_unitario_entrada: string | number | null;
  referencia_venta_id: string | null;
  productos: {
    id: string;
    codigo: string;
    nombre_producto: string;
  } | null;
  empleados: {
    id: string;
    nombre: string | null;
  } | null;
};

export type ClienteRow = {
  id: string;
  nombre: string;
  documento: string;
  celular: string;
  creado_en: string;
};

export type CajaRow = {
  id: string;
  tipo: 'CARGO' | 'PAGO';

}

export type ProductoRow = {
  id: string;
  codigo: string;
  nombre_producto: string;
  costo: number;
  precio: number;
  activo: boolean;
  creado_en: string;
};

export type InventarioRow = {
  id: string;
  tipo: 'REPOSICION' | 'VENTA' | 'AJUSTE';
  cantidad_cambio: number;
  costo_unitario_entrada: number | null;
  referencia_venta_id: string | null;
  creado_en: string;
};

export type KardexRow = {
  id: string;
  fecha: string;
  tipo: string;
  entrada: number;
  salida: number;
  saldoUnidades: number;
  costoPromedio: number;
  saldoCostoTotal: number;
};

export type VentaRow = {
  id: string;
  total: string | number | null;
  pagado: string | number | null;
  creado_en: string | null;
  // Support future columns without changing the rendering approach:
  [key: string]: unknown;
};