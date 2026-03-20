import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ProductionOrder from '@/models/ProductionOrder';
import Recipe from '@/models/Recipe';
import ProductStock from '@/models/ProductStock';
import StockMovement from '@/models/StockMovement';
import Batch from '@/models/Batch';
import mongoose from 'mongoose';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const orders = await ProductionOrder.find({})
      .populate('finishedProduct', 'productName productNameAr productCode')
      .populate('recipe')
      .sort({ createdAt: -1 });
    return NextResponse.json({ orders });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    // Default to PENDING
    const order = await ProductionOrder.create({ ...body, user: user.id });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
