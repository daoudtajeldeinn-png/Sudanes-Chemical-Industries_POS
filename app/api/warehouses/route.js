import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Warehouse from '@/models/Warehouse';
import { getAuthUser } from '@/lib/auth';
export async function GET() {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const warehouses = await Warehouse.find({ isActive: true });
    return NextResponse.json({ warehouses });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
