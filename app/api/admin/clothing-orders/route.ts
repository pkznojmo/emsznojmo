import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin, getUserRole } from '@/lib/clothing-store';

async function authorizeAdmin(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: NextResponse.json({ message: 'Přihlášení vypršelo.' }, { status: 401 }) };
  if (await getUserRole(user.id) !== 'ADMIN') return { error: NextResponse.json({ message: 'Tato část je dostupná pouze administrátorům.' }, { status: 403 }) };
  return { user };
}

export async function GET(request: Request) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth.error) return auth.error;
    const db = getSupabaseAdmin();
    const [{ data: orders, error }, { data: inventory, error: stockError }] = await Promise.all([
      db.from('ems_clothing_orders').select('*').order('created_at', { ascending: false }).limit(500),
      db.from('ems_clothing_inventory').select('size, stock').order('size'),
    ]);
    if (error) throw error;
    if (stockError) throw stockError;
    const counts = { total: orders.length, inProgress: 0, completed: 0, new: 0 };
    for (const order of orders) {
      if (order.status === 'NEW') counts.new++;
      if (['NEW', 'IN_PROCESS', 'READY'].includes(order.status)) counts.inProgress++;
      if (order.status === 'COMPLETED') counts.completed++;
    }
    return NextResponse.json({ orders, inventory: inventory || [], counts });
  } catch (error) {
    console.error('Chyba při načítání správy EMS oblečení:', error);
    return NextResponse.json({ message: 'Správu objednávek se nepodařilo načíst.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth.error) return auth.error;
    const body = await request.json();
    const db = getSupabaseAdmin();
    if (body.action === 'inventory_add') {
      const size = String(body.size || '').toUpperCase();
      const amount = Number(body.amount);
      if (!['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size) || !Number.isInteger(amount) || amount < 1) {
        return NextResponse.json({ message: 'Vyberte velikost a zadejte počet kusů k naskladnění.' }, { status: 400 });
      }
      const { data, error } = await db.rpc('add_ems_clothing_stock', { target_size: size, amount_to_add: amount });
      if (error) throw error;
      return NextResponse.json({ inventory: data });
    }

    const orderId = String(body.orderId || '');
    const status = String(body.status || '');
    if (!orderId || !['NEW', 'IN_PROCESS', 'READY', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ message: 'Objednávka nebo její stav nejsou platné.' }, { status: 400 });
    }
    const { data: current, error: currentError } = await db.from('ems_clothing_orders').select('id, status, quantity, size').eq('id', orderId).single();
    if (currentError) throw currentError;
    if (status === 'CANCELLED' && current.status !== 'CANCELLED') {
      const { data: inventory, error: inventoryError } = await db.from('ems_clothing_inventory').select('stock').eq('size', current.size).single();
      if (inventoryError) throw inventoryError;
      const { error: stockError } = await db.from('ems_clothing_inventory').update({ stock: inventory.stock + current.quantity, updated_at: new Date().toISOString() }).eq('size', current.size);
      if (stockError) throw stockError;
    }
    const { data, error } = await db.from('ems_clothing_orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId).select('*').single();
    if (error) throw error;
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error('Chyba při aktualizaci EMS objednávky:', error);
    return NextResponse.json({ message: 'Změnu objednávky se nepodařilo uložit.' }, { status: 500 });
  }
}
