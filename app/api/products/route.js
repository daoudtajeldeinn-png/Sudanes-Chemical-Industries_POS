import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import ProductStock from '@/models/ProductStock';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const filter = { isActive: { $ne: false } };
    if (q) filter.$or = [
      { productName: { $regex: q, $options: 'i' } },
      { productNameAr: { $regex: q, $options: 'i' } },
      { productCode: { $regex: q, $options: 'i' } },
      { barcode: { $regex: q, $options: 'i' } },
    ];
    if (category) filter.category = category;

    const products = await Product.find(filter)
      .populate('category', 'categoryName categoryNameAr')
      .populate('unit', 'unitName unitCode')
      .sort({ productName: 1 })
      .lean();

    // Get stock for all products in one efficient step
    const productIds = products.map(p => p._id);
    const stocks = await ProductStock.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: '$product', total: { $sum: '$quantity' } } }
    ]);

    const stockMap = stocks.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.total;
      return acc;
    }, {});

    const result = products.map(p => ({
      ...p,
      stock: stockMap[p._id.toString()] || 0,
    }));

    return NextResponse.json({ products: result });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}


export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const { initialStock, warehouseId, ...productData } = body;
    const product = await Product.create(productData);

    // Add initial stock if provided
    if (initialStock > 0 && warehouseId) {
      await ProductStock.create({ product: product._id, warehouse: warehouseId, quantity: initialStock });
    }
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
