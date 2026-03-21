import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import connectDB from '@/lib/mongodb';
import Expense, { ExpenseCategory } from '@/models/Expense';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const filter = {};
    if (from || to) {
      filter.expenseDate = {};
      if (from) filter.expenseDate.$gte = new Date(from);
      if (to) filter.expenseDate.$lte = new Date(to + 'T23:59:59');
    }
    const [expenses, categories] = await Promise.all([
      Expense.find(filter).populate('category', 'categoryName').sort({ expenseDate: -1 }).limit(300).lean(),
      ExpenseCategory.find({ isActive: true }).lean(),
    ]);
    return NextResponse.json({ expenses, categories });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const user = getAuthUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await connectDB();
    const body = await req.json();
    body.user = user.id;

    if (body.category === 'OTHER' && body.customCategoryName) {
      // Create a new expense category dynamically
      const newCat = await ExpenseCategory.create({ categoryName: body.customCategoryName, isActive: true });
      body.category = newCat._id;
      body.categoryName = newCat.categoryName;
    } else {
      const cat = await ExpenseCategory.findById(body.category);
      if (cat) body.categoryName = cat.categoryName;
    }
    
    const expense = await Expense.create(body);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 400 }); }
}
