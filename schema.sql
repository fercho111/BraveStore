-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.caja (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL,
  tipo USER-DEFINED NOT NULL,
  monto numeric NOT NULL CHECK (monto > 0::numeric),
  venta_id uuid,
  empleado_id uuid NOT NULL,
  nota text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT caja_pkey PRIMARY KEY (id),
  CONSTRAINT caja_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT caja_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT caja_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  documento text UNIQUE,
  celular text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.empleados (
  id uuid NOT NULL,
  rol USER-DEFINED NOT NULL DEFAULT 'cajero'::rol_empleado,
  nombre text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT empleados_pkey PRIMARY KEY (id),
  CONSTRAINT empleados_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL,
  tipo USER-DEFINED NOT NULL,
  cantidad_cambio integer NOT NULL CHECK (cantidad_cambio <> 0),
  costo_unitario_entrada numeric CHECK (costo_unitario_entrada IS NULL OR costo_unitario_entrada >= 0::numeric),
  empleado_id uuid NOT NULL,
  referencia_venta_id uuid,
  nota text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventario_pkey PRIMARY KEY (id),
  CONSTRAINT inventario_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id),
  CONSTRAINT inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT inventario_referencia_venta_id_fkey FOREIGN KEY (referencia_venta_id) REFERENCES public.ventas(id)
);
CREATE TABLE public.productos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  nombre_producto text NOT NULL,
  precio numeric NOT NULL CHECK (precio >= 0::numeric),
  costo numeric NOT NULL DEFAULT 0 CHECK (costo >= 0::numeric),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT productos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  empleado_id uuid NOT NULL,
  total numeric NOT NULL CHECK (total >= 0::numeric),
  pagado numeric NOT NULL DEFAULT 0 CHECK (pagado >= 0::numeric),
  nota text,
  creado_en timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ventas_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id),
  CONSTRAINT ventas_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleados(id)
);
CREATE TABLE public.ventas_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL,
  producto_id uuid NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric NOT NULL CHECK (precio_unitario >= 0::numeric),
  costo_unitario numeric NOT NULL CHECK (costo_unitario >= 0::numeric),
  CONSTRAINT ventas_items_pkey PRIMARY KEY (id),
  CONSTRAINT ventas_items_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id),
  CONSTRAINT ventas_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);