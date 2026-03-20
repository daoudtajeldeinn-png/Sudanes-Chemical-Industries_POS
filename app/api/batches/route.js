import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Batch from '@/models/Batch';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const batches = await Batch.find({ currentQty: { $gt: 0 } })
      .populate('product', 'productName productNameAr productCode')
      .populate('warehouse', 'warehouseName')
      .sort({ expiryDate: 1 });

    return NextResponse.json({ batches });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
