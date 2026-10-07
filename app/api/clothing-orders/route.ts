import { NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/clothing-store';

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) return NextResponse.json({ message: 'Přihlášení vypršelo.' }, { status: 401 });
    const db = getSupabaseAdmin();
    const [{ data: orders, error }, { data: inventory, error: inventoryError }] = await Promise.all([
      db.from('ems_clothing_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      db.from('ems_clothing_inventory').select('size, stock').order('size'),
    ]);
    if (error) throw error;
    if (inventoryError) throw inventoryError;
    return NextResponse.json({ orders: orders || [], inventory: inventory || [] });
  } catch (error) {
    console.error('Chyba při načítání objednávek EMS oblečení:', error);
    return NextResponse.json({ message: 'Objednávky se nepodařilo načíst.' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ message: 'Objednávky oblečení se vytvářejí a platí přes GoPay.' }, { status: 405 });
}
