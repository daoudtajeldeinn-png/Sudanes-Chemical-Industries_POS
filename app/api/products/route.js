import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import ProductStock from '@/models/ProductStock';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const filter = { isActive: true };
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
      .sort({ productName: 1 });

    // Get stock for each product
    const stocks = await ProductStock.find({ product: { $in: products.map(p => p._id) } });
    const stockMap = {};
    stocks.forEach(s => { stockMap[s.product.toString()] = (stockMap[s.product.toString()] || 0) + s.quantity; });

    const result = products.map(p => ({
      ...p.toObject(),
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
