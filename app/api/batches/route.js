import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Batch from '@/models/Batch';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product');
    const warehouseId = searchParams.get('warehouse');
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const filter = { 
      product: productId, 
      currentQty: { $gt: 0 },
      status: 'Active'
    };
    
    if (warehouseId) {
      filter.warehouse = warehouseId;
    }

    const batches = await Batch.find(filter).sort({ expiryDate: 1 });
    return NextResponse.json({ batches });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
