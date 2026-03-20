import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const recipes = await Recipe.find({})
      .populate('finishedProduct', 'productName productNameAr productCode')
      .populate('ingredients.product', 'productName productNameAr productCode')
      .sort({ updatedAt: -1 });
    return NextResponse.json({ recipes });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const user = getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    const recipe = await Recipe.create(body);
    return NextResponse.json({ recipe }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
