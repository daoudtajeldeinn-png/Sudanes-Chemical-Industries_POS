import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sale from '@/models/Sale';
import { getAuthUser } from '@/lib/auth';
export async function GET(req, { params }) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const sale = await Sale.findById(params.id)
      .populate('customer', 'customerName customerCode phone address city')
      .populate('user', 'fullName')
      .populate('warehouse', 'warehouseName');
    if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ sale });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
