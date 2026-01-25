// app/ventas/nueva/actions.ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ItemSubmit = {
  productoId: string;
  cantidad: number;
};

type MedioCaja = 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO';

export async function crearVenta(formData: FormData) {
  const supabase = await createClient();

  // 1. Usuario (cajero) autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const authUserId = user.id;

  // 2. Validar que el usuario sea un empleado registrado
  const { data: empleado, error: empleadoError } = await supabase
    .from("empleados")
    .select("id, rol")
    .eq("id", authUserId)
    .single();

  if (empleadoError || !empleado) {
    throw new Error("Empleado inválido o no registrado.");
  }

  const empleadoId = empleado.id as string;

  // 3. Leer datos del formulario
  const clienteIdRaw = formData.get("clienteId");
  const itemsJson = formData.get("items");
  const pagoClienteRaw = formData.get("pagoCliente");
  const medioRaw = formData.get('medio');

  if (
    !clienteIdRaw ||
    typeof clienteIdRaw !== "string" ||
    !itemsJson ||
    typeof itemsJson !== "string"
  ) {
    throw new Error("Datos de venta incompletos.");
  }

  const clienteId = clienteIdRaw;

  // 4. Verificar cliente existe
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente) {
    throw new Error("Cliente inválido.");
  }

  // 5. Parsear y validar items del body (sin escribir nada en DB aún)
  let rawItems: ItemSubmit[];
  try {
    rawItems = JSON.parse(itemsJson) as ItemSubmit[];
  } catch (e) {
    throw new Error("Formato de items inválido." + (e instanceof Error ? e.message : ""));
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("La venta debe tener al menos un ítem.");
  }

  // 5.1 Normalizar / mergear por productoId y validar cantidades
  const mergedMap = new Map<string, number>();

  for (const item of rawItems) {
    if (
      !item ||
      typeof item.productoId !== "string" ||
      item.productoId.trim() === ""
    ) {
      throw new Error("Producto inválido en los items.");
    }

    const cantidadNum = Number(item.cantidad);

    if (!Number.isInteger(cantidadNum) || cantidadNum <= 0) {
      throw new Error("Las cantidades deben ser enteros positivos.");
    }

    const current = mergedMap.get(item.productoId) ?? 0;
    mergedMap.set(item.productoId, current + cantidadNum);
  }

  const items: ItemSubmit[] = Array.from(mergedMap.entries()).map(
    ([productoId, cantidad]) => ({
      productoId,
      cantidad,
    })
  );

  if (items.length === 0) {
    throw new Error("La venta debe tener al menos un ítem válido.");
  }

  // 6. Verificar productos y leer precios y costos
  const productoIds = items.map((i) => i.productoId);

  const { data: productos, error: productosError } = await supabase
    .from("productos")
    .select("id, precio, costo, activo")
    .in("id", productoIds);

  if (productosError || !productos || productos.length !== productoIds.length) {
    throw new Error("Alguno de los productos de la venta no es válido.");
  }

  // Mapa de precios y costos
  const precioPorId = new Map<string, number>();
  const costoPorId = new Map<string, number>();

  for (const p of productos) {
    if (p.activo === false) {
      throw new Error("Hay productos inactivos en la venta.");
    }
    precioPorId.set(p.id as string, Number(p.precio));
    costoPorId.set(p.id as string, Number(p.costo ?? 0));
  }

  // 7. Calcular total de la venta
  let total = 0;

  for (const item of items) {
    const precio = precioPorId.get(item.productoId);
    if (precio === undefined) {
      throw new Error("Precio no encontrado para un producto.");
    }
    total += precio * item.cantidad;
  }

  if (total < 0) {
    throw new Error("El total calculado de la venta es inválido.");
  }

  // 8. Validar pago del cliente (pagoCliente)
  let pagado = 0;

  if (
    pagoClienteRaw !== null &&
    typeof pagoClienteRaw === "string" &&
    pagoClienteRaw.trim() !== ""
  ) {
    const pagoNum = Number(pagoClienteRaw);

    if (!Number.isInteger(pagoNum)) {
      throw new Error("El pago del cliente debe ser un número entero.");
    }

    if (Number.isNaN(pagoNum) || pagoNum < 0) {
      throw new Error("El pago del cliente no puede ser negativo.");
    }

    if (pagoNum > total) {
      throw new Error("El pago del cliente no puede ser mayor al total.");
    }

    pagado = pagoNum;
  }

  // Hasta aquí, TODA la validación hecha. A partir de ahora sí empezamos a escribir en la BD.

  // 9. Crear la venta (cabecera)
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      cliente_id: clienteId,
      empleado_id: empleadoId,
      total,
      pagado,
      // nota: podrías recibir una nota del form si quieres
    })
    .select("id")
    .single();

  if (ventaError || !venta) {
    console.error("Error creando venta:", ventaError);
    throw new Error("No se pudo crear la venta.");
  }

  const ventaId = venta.id as string;

  // 10. Crear las líneas de venta (ventas_items) con snapshot de precio y costo
  const itemsInsert = items.map((item) => ({
    venta_id: ventaId,
    producto_id: item.productoId,
    cantidad: item.cantidad,
    precio_unitario: precioPorId.get(item.productoId) ?? 0,
    costo_unitario: costoPorId.get(item.productoId) ?? 0,
  }));

  const { error: itemsError } = await supabase
    .from("ventas_items")
    .insert(itemsInsert);

  if (itemsError) {
    console.error("Error creando items de venta:", itemsError);
    throw new Error("No se pudieron crear los ítems de la venta.");
  }

  // 11. Movimientos de inventario (VENTA, cantidades negativas)
  const inventarioMovimientos = items.map((item) => ({
    producto_id: item.productoId,
    tipo: "VENTA" as const,
    cantidad_cambio: -item.cantidad, // venta => negativo
    costo_unitario_entrada: null, // sólo aplica para REPOSICION
    empleado_id: empleadoId,
    referencia_venta_id: ventaId,
  }));

  const { error: inventarioError } = await supabase
    .from("inventario")
    .insert(inventarioMovimientos);

  if (inventarioError) {
    console.error("Error creando movimientos de inventario:", inventarioError);
    throw new Error("No se pudieron registrar los movimientos de inventario.");
  }

  let medio: MedioCaja | null = null;

  if (medioRaw != null && typeof medioRaw === 'string' && medioRaw !== '') {
    if (
      medioRaw === 'EFECTIVO' ||
      medioRaw === 'TRANSFERENCIA' ||
      medioRaw === 'OTRO'
    ) {
      medio = medioRaw;
    } else {
      throw new Error('Medio de pago inválido.');
    }
  }

  if (pagado > 0 && medio === null) {
    throw new Error('Debe seleccionarse un medio de pago cuando hay pago.');
  }

  // 12. Movimientos de caja (CARGO por el total y, opcionalmente, PAGO por lo pagado)
  const cajaRegistros: Array<{
    cliente_id: string;
    tipo: "CARGO" | "PAGO";
    monto: number;
    venta_id: string;
    empleado_id: string;
    medio: MedioCaja | null;
  }> = [];

  // CARGO por el total de la venta
  cajaRegistros.push({
    cliente_id: clienteId,
    tipo: "CARGO",
    monto: total,
    venta_id: ventaId,
    empleado_id: empleadoId,
    medio: null, // los cargos no tienen medio
  });

  // PAGO (si pagó algo en el momento)
  if (pagado > 0) {
    cajaRegistros.push({
      cliente_id: clienteId,
      tipo: "PAGO",
      monto: pagado,
      venta_id: ventaId,
      empleado_id: empleadoId,
      medio: medio,
    });
  }

  const { error: cajaError } = await supabase.from("caja").insert(cajaRegistros);

  if (cajaError) {
    console.error("Error creando movimientos de caja:", cajaError);
    throw new Error("No se pudieron registrar los movimientos de caja.");
  }

  // 13. Redirigir al detalle de la venta (o a donde definas)
  redirect(`/ventas/${ventaId}`);
}