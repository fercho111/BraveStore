-- =========================================================
-- Gym microstore - Schema inicial (Supabase / Postgres)
-- Opción 2: costo promedio ponderado (WAC)
-- Tablas: empleados, clientes, productos, ventas, ventas_items, inventario, caja
-- =========================================================

-- Recomendado en Supabase para UUIDs
create extension if not exists "pgcrypto";

-- =========================================================
-- ENUMs
-- =========================================================
do $$ begin
  create type rol_empleado as enum ('admin', 'cajero');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type inventario_tipo as enum ('REPOSICION', 'VENTA', 'AJUSTE');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type caja_tipo as enum ('CARGO', 'PAGO');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type medio_pago as enum ('EFECTIVO', 'TRANSFERENCIA', 'OTRO');
exception
  when duplicate_object then null;
end $$;

-- Gender
do $$ begin
  create type genero_cliente as enum (
    'M',
    'F',
    'OTRO'
  );
exception
  when duplicate_object then null;
end $$;

-- Age group (proxy)
do $$ begin
  create type grupo_edad_cliente as enum (
    'MENOR_18',
    'ED_18_25',
    'ED_26_35',
    'ED_36_45',
    'ED_46_60',
    'MAYOR_60'
  );
exception
  when duplicate_object then null;
end $$;


-- =========================================================
-- empleados
-- Supabase Auth vive en auth.users; aquí guardamos rol y metadata.
-- =========================================================
create table if not exists public.empleados (
  id uuid primary key references auth.users(id) on delete cascade,
  rol rol_empleado not null default 'cajero',
  nombre text null,
  creado_en timestamptz not null default now()
);

-- =========================================================
-- clientes
-- =========================================================


create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  documento text null unique,        -- cédula / ID / documento
  celular text null,

  genero genero_cliente null,
  grupo_edad grupo_edad_cliente null,

  creado_en timestamptz not null default now()
);


-- =========================================================
-- productos
-- costo = costo promedio unitario (WAC) -> se actualiza en reposición
-- precio = precio de venta unitario actual
-- codigo = SKU o código interno (único)
-- =========================================================
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre_producto text not null,
  precio numeric(12,2) not null check (precio >= 0),
  costo numeric(12,2) not null default 0 check (costo >= 0),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- =========================================================
-- ventas (cabecera)
-- cliente_id puede ser NULL para ventas "walk-in"
-- total y pagado capturan el estado al momento de la venta
-- =========================================================
create table if not exists public.ventas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid null references public.clientes(id) on delete set null,
  empleado_id uuid not null references public.empleados(id) on delete restrict,
  total numeric(12,2) not null check (total >= 0),
  pagado numeric(12,2) not null default 0 check (pagado >= 0),
  creado_en timestamptz not null default now(),
  constraint ventas_pagado_no_excede_total check (pagado <= total)
);

-- =========================================================
-- ventas_items (líneas)
-- Guardamos snapshots:
--   - precio_unitario: precio vendido en ese momento
--   - costo_unitario: costo promedio del producto en ese momento (para margen histórico)
-- =========================================================
create table if not exists public.ventas_items (
  id uuid primary key default gen_random_uuid(),
  venta_id uuid not null references public.ventas(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete restrict,
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(12,2) not null check (precio_unitario >= 0),
  costo_unitario numeric(12,2) not null check (costo_unitario >= 0)
);

-- Evita duplicados del mismo producto dentro de la misma venta (opcional pero recomendable)
create unique index if not exists ux_ventas_items_venta_producto
  on public.ventas_items(venta_id, producto_id);

-- =========================================================
-- inventario (ledger de movimientos)
-- cantidad_cambio: + reposición / - venta / +/- ajuste
-- costo_unitario_entrada: solo aplica a REPOSICION (costo del proveedor por unidad)
-- referencia_venta_id: si el movimiento fue por una venta
-- =========================================================
create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos(id) on delete restrict,
  tipo inventario_tipo not null,
  cantidad_cambio integer not null check (cantidad_cambio <> 0),
  costo_unitario_entrada numeric(12,2) null check (costo_unitario_entrada is null or costo_unitario_entrada >= 0),
  empleado_id uuid not null references public.empleados(id) on delete restrict,
  referencia_venta_id uuid null references public.ventas(id) on delete set null,
  creado_en timestamptz not null default now(),

  -- Convenciones: una venta debe referenciar una id ,venta debe ser negativa; reposición positiva.
  constraint inventario_venta_ref_consistency check (
    (tipo = 'VENTA') = (referencia_venta_id is not null)
  ),

  constraint inventario_venta_negativa check (
    (tipo <> 'VENTA') or (cantidad_cambio < 0)
  ),
  constraint inventario_reposicion_positiva check (
    (tipo <> 'REPOSICION') or (cantidad_cambio > 0)
  )
);

-- =========================================================
-- caja (ledger de cuentas por cobrar / pagos)
-- Convención: monto siempre positivo, el tipo determina el signo lógico.
-- saldo_cliente = sum(CARGO) - sum(PAGO)
-- venta_id opcional para cargos asociados a una venta
-- =========================================================
create table if not exists public.caja (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  tipo caja_tipo not null,
  monto numeric(12,2) not null check (monto > 0),
  venta_id uuid null references public.ventas(id) on delete set null,
  empleado_id uuid not null references public.empleados(id) on delete restrict,
  medio medio_pago null,
  creado_en timestamptz not null default now(),
  constraint caja_medio_consistency check (
    (tipo = 'PAGO'  and medio is not null) or
    (tipo = 'CARGO' and medio is null)
  ),
  constraint caja_cargo_requiere_venta check (
    tipo <> 'CARGO' or venta_id is not null
  )
);

-- =========================================================
-- Índices recomendados
-- =========================================================
create index if not exists ix_ventas_creado_en on public.ventas(creado_en desc);
create index if not exists ix_ventas_cliente on public.ventas(cliente_id);
create index if not exists ix_ventas_empleado on public.ventas(empleado_id);

create index if not exists ix_inventario_producto on public.inventario(producto_id, creado_en desc);
create index if not exists ix_inventario_venta_ref on public.inventario(referencia_venta_id);

create index if not exists ix_caja_cliente on public.caja(cliente_id, creado_en desc);
create index if not exists ix_caja_venta on public.caja(venta_id);

-- =========================================================
-- Vistas útiles (opcional, pero muy práctico)
-- =========================================================

-- Stock actual por producto: SUM(cantidad_cambio)
create or replace view public.v_stock_actual as
select
  p.id as producto_id,
  p.codigo,
  p.nombre_producto,
  coalesce(sum(i.cantidad_cambio), 0) as stock
from public.productos p
left join public.inventario i on i.producto_id = p.id
group by p.id, p.codigo, p.nombre_producto;

-- Saldo actual por cliente: SUM(CARGO) - SUM(PAGO)
create or replace view public.v_saldo_clientes as
select
  c.id as cliente_id,
  c.nombre,
  c.documento,
  c.celular,
  coalesce(sum(case when x.tipo = 'CARGO' then x.monto else 0 end), 0)
  -
  coalesce(sum(case when x.tipo = 'PAGO' then x.monto else 0 end), 0)
  as saldo
from public.clientes c
left join public.caja x on x.cliente_id = c.id
group by c.id, c.nombre, c.documento, c.celular;


-- =========================================================
-- RLS: habilitar
-- (Políticas mínimas de arranque: solo usuarios autenticados)
-- Luego se endurece por rol (admin/cajero) con políticas específicas.
-- =========================================================
alter table public.empleados enable row level security;
alter table public.clientes enable row level security;
alter table public.productos enable row level security;
alter table public.ventas enable row level security;
alter table public.ventas_items enable row level security;
alter table public.inventario enable row level security;
alter table public.caja enable row level security;

-- Políticas básicas (arranque): autenticados pueden leer/escribir todo.
-- IMPORTANTE: Esto es intencionalmente simple para la primera iteración.
-- En la siguiente iteración: restringimos por rol y por operación.
do $$ begin
  create policy "auth_all_select_empleados" on public.empleados
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_select_clientes" on public.clientes
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_clientes" on public.clientes
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_productos" on public.productos
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_ventas" on public.ventas
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_ventas_items" on public.ventas_items
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_inventario" on public.inventario
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "auth_all_crud_caja" on public.caja
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
