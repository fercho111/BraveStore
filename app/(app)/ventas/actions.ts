'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createVenta(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Error obteniendo usuario: ${userError.message}`);
  }

  if (!user) {
    redirect('/login');
  }

  const empleadoId = user.id;

  // 2) Leer arrays de producto_ids[] y cantidades[]
  const rawProductoIds = formData.getAll('producto_ids[]') as string[];
  const rawCantidades = formData.getAll('cantidades[]') as string[];

  // Filtrar líneas vacías / inconsistentes
  const lineasBrutas = rawProductoIds
    .map((id, idx) => ({
      productoId: id?.trim() || '',
      cantidad: Number(rawCantidades[idx] ?? '0'),
    }))
    .filter((l) => l.productoId !== '' && Number.isFinite(l.cantidad) && l.cantidad > 0);

  if (lineasBrutas.length === 0) {
    throw new Error('No se recibieron productos válidos para la venta.');
  }

  // 3) Obtener productos desde la base de datos
  const ids = lineasBrutas.map((l) => l.productoId);

  const { data: productosData, error: productosError } = await supabase
    .from('productos')
    .select('id, precio, costo')
    .in('id', ids);

  if (productosError) {
    throw new Error(`Error cargando productos: ${productosError.message}`);
  }

  if (!productosData || productosData.length === 0) {
    throw new Error('No se encontraron los productos seleccionados.');
  }

  const productosMap = new Map(
    productosData.map((p) => [p.id as string, p] as const),
  );

  // 4) Calcular total de la venta y preparar líneas
  type LineaVenta = {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario: number;
  };

  const lineas: LineaVenta[] = [];
  let total = 0;

  for (const l of lineasBrutas) {
    const producto = productosMap.get(l.productoId);
    if (!producto) {
      throw new Error(`Producto no encontrado (ID: ${l.productoId}).`);
    }

    const precioUnitario = Number(producto.precio);
    const costoUnitario = Number(producto.costo);
    if (!Number.isFinite(precioUnitario) || !Number.isFinite(costoUnitario)) {
      throw new Error('Datos de precio/costo inválidos para algún producto.');
    }

    const lineaTotal = precioUnitario * l.cantidad;
    total += lineaTotal;

    lineas.push({
      productoId: l.productoId,
      cantidad: l.cantidad,
      precioUnitario,
      costoUnitario,
    });
  }

  if (total <= 0) {
    throw new Error('El total de la venta es inválido (<= 0).');
  }

  // Por ahora: venta totalmente pagada, sin cliente (walk-in)
  const pagado = total;
  const nota = (formData.get('nota') as string | null)?.trim() || null;

  // 5) Insertar en ventas
  const { data: ventaInsert, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      cliente_id: null,          // más adelante: cliente_id real si aplica
      empleado_id: empleadoId,
      total,
      pagado,
      nota,
    })
    .select('id')
    .single();

  if (ventaError) {
    throw new Error(`Error creando venta: ${ventaError.message}`);
  }

  const ventaId = ventaInsert.id as string;

  // 6) Insertar en ventas_items
  const ventasItemsToInsert = lineas.map((l) => ({
    venta_id: ventaId,
    producto_id: l.productoId,
    cantidad: l.cantidad,
    precio_unitario: l.precioUnitario,
    costo_unitario: l.costoUnitario,
  }));

  const { error: itemsError } = await supabase
    .from('ventas_items')
    .insert(ventasItemsToInsert);

  if (itemsError) {
    // Nota: la venta ya fue creada; en un sistema más robusto
    // moveríamos todo a una función SQL transaccional.
    throw new Error(`Error creando líneas de venta: ${itemsError.message}`);
  }

  // 7) Insertar movimientos de inventario (venta = salida de stock)
  const inventarioMovimientos = lineas.map((l) => ({
    producto_id: l.productoId,
    tipo: 'VENTA',                // enum inventario_tipo
    cantidad_cambio: -l.cantidad, // salida
    costo_unitario_entrada: null, // solo relevante en REPOSICION
    empleado_id: empleadoId,
    referencia_venta_id: ventaId,
    nota: 'Venta',
  }));

  const { error: inventarioError } = await supabase
    .from('inventario')
    .insert(inventarioMovimientos);

  if (inventarioError) {
    // Igual que arriba: en producción, esto debería ser transaccional.
    throw new Error(`Error registrando movimientos de inventario: ${inventarioError.message}`);
  }

  // Más adelante: aquí podrías insertar en caja/movimientos si quieres
  // reflejar el pago inmediato.

  // 8) Redirigir a la lista de ventas (o al detalle de la venta, si lo tienes)
  redirect('/ventas');
}
