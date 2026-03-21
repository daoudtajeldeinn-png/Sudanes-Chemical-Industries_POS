import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Transfer from '@/models/Transfer';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const transfers = await Transfer.find({})
      .populate('fromWarehouse', 'warehouseName')
      .populate('toWarehouse', 'warehouseName')
      .populate('items.product', 'productName productNameAr')
      .sort({ createdAt: -1 });
    return NextResponse.json({ transfers });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const transfer = await Transfer.create({ ...body, user: user.id });
    return NextResponse.json({ transfer }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
