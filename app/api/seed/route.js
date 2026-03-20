import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import CustomerGroup from '@/models/CustomerGroup';
import Supplier from '@/models/Supplier';
import Category from '@/models/Category';
import Unit from '@/models/Unit';
import Warehouse from '@/models/Warehouse';
import ProductStock from '@/models/ProductStock';
import CompanySettings from '@/models/CompanySettings';
import { ExpenseCategory } from '@/models/Expense';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();

    // Create Default Users for Departments
    const defaultUsers = [
      { username: 'admin',     passwordHash: '123456', fullName: 'مدير النظام', roleName: 'مدير النظام' },
      { username: 'prod_mgr',  passwordHash: '123456', fullName: 'مدير الإنتاج', roleName: 'مدير الإنتاج' },
      { username: 'wh_mgr',    passwordHash: '123456', fullName: 'أمين المخزن', roleName: 'أمين المخزن' },
      { username: 'acc_mgr',   passwordHash: '123456', fullName: 'المحاسب المالي', roleName: 'محاسب' },
      { username: 'sales_rep', passwordHash: '123456', fullName: 'مندوب مبيعات', roleName: 'مسؤول مبيعات' },
    ];

    for (const u of defaultUsers) {
      const exists = await User.findOne({ username: u.username });
      if (exists) {
        exists.passwordHash = u.passwordHash;
        exists.roleName = u.roleName;
        exists.isActive = true;
        await exists.save();
      } else {
        await User.create(u);
      }
    }

    // Company settings
    await CompanySettings.findOneAndUpdate({}, {
      companyName: 'Sudanese Chemical Industries',
      companyNameAr: 'الصناعات الكيميائية السودانية',
      phone: '+249912345678',
      email: 'info@sci.sd',
      address: 'الخرطوم، السودان',
      taxRate: 0,
      currency: 'SDG',
      currencyCode: 'SDG',
      invoiceHeader: 'الصناعات الكيميائية السودانية',
      invoiceFooter: 'شكراً لتعاملكم معنا',
    }, { upsert: true });

    // Default warehouse
    const warehouse = await Warehouse.findOneAndUpdate(
      { warehouseName: 'المخزن الرئيسي' },
      { warehouseName: 'المخزن الرئيسي', location: 'الخرطوم - المقر الرئيسي', isDefault: true, isActive: true },
      { upsert: true, new: true }
    );

    // Units
    const unitData = [
      { unitName: 'قطعة', unitCode: 'PCS' },
      { unitName: 'كيلو', unitCode: 'KG' },
      { unitName: 'لتر', unitCode: 'L' },
      { unitName: 'متر', unitCode: 'M' },
      { unitName: 'كرتون', unitCode: 'CTN' },
      { unitName: 'صندوق', unitCode: 'BOX' },
      { unitName: 'طن', unitCode: 'TON' },
    ];
    const units = {};
    for (const u of unitData) {
      const unit = await Unit.findOneAndUpdate({ unitCode: u.unitCode }, { ...u, isActive: true }, { upsert: true, new: true });
      units[u.unitCode] = unit._id;
    }

    // Categories
    const catData = [
      { categoryName: 'Finished Products', categoryNameAr: 'منتجات نهائية (دوائية)' },
      { categoryName: 'Active Raw Materials', categoryNameAr: 'مواد خام فعالة' },
      { categoryName: 'Inactive Raw Materials', categoryNameAr: 'مواد خام غير فعالة' },
      { categoryName: 'Packaging Materials', categoryNameAr: 'مواد تعبئة وتغليف' },
      { categoryName: 'Admin & Consumables', categoryNameAr: 'وقود ومواد غذائية ومنصرفات' },
    ];
    const cats = {};
    for (const c of catData) {
      const cat = await Category.findOneAndUpdate({ categoryName: c.categoryName }, { ...c, isActive: true }, { upsert: true, new: true });
      cats[c.categoryName] = cat._id;
    }

    // Products (SCI Classification)
    const productsData = [
      { productCode: 'SCI-001', productName: 'Asprona 100mg', productNameAr: 'اسبرونا 100ملجم', category: cats['Finished Products'], unit: units['PCS'], costPrice: 50, retailPrice: 100, productType: 'FINISHED_GOOD' },
      { productCode: 'SCI-002', productName: 'Asprona 300', productNameAr: 'اسبرونا 300', category: cats['Finished Products'], unit: units['PCS'], costPrice: 80, retailPrice: 150, productType: 'FINISHED_GOOD' },
      { productCode: 'SCI-003', productName: 'Asprona 75', productNameAr: 'اسبرونا 75', category: cats['Finished Products'], unit: units['PCS'], costPrice: 40, retailPrice: 80, productType: 'FINISHED_GOOD' },
      { productCode: 'SCI-004', productName: 'Trichocid 500mg', productNameAr: 'ترايكوسيد 500 ملجم Trichocid500mg', category: cats['Finished Products'], unit: units['BOX'], costPrice: 800, retailPrice: 1400, productType: 'FINISHED_GOOD' },
      { productCode: 'RAW-ACT-001', productName: 'Aspirin Powder (Active)', productNameAr: 'بودرة أسبرين (خام فعال)', category: cats['Active Raw Materials'], unit: units['KG'], costPrice: 20, currency: 'USD', productType: 'RAW_MATERIAL' },
      { productCode: 'RAW-INA-001', productName: 'Talcum Powder', productNameAr: 'بودرة تالك (غير فعالة)', category: cats['Inactive Raw Materials'], unit: units['KG'], costPrice: 5, currency: 'USD', productType: 'RAW_MATERIAL' },
      { productCode: 'PACK-001', productName: 'Empty Glass Bottle', productNameAr: 'عبوات زجاجية فارغة', category: cats['Packaging Materials'], unit: units['PCS'], costPrice: 200, productType: 'PACKAGING' },
      { productCode: 'FUEL-001', productName: 'Diesel', productNameAr: 'ديزل (وقود)', category: cats['Admin & Consumables'], unit: units['L'], costPrice: 1500, productType: 'CONSUMABLE' },
    ];

    for (const p of productsData) {
      const prod = await Product.findOneAndUpdate({ productCode: p.productCode }, { ...p, isActive: true }, { upsert: true, new: true });
      // Stock (random initial)
      const qty = Math.floor(Math.random() * 400) + 50;
      await ProductStock.findOneAndUpdate(
        { product: prod._id, warehouse: warehouse._id },
        { product: prod._id, warehouse: warehouse._id, quantity: qty },
        { upsert: true }
      );
    }

    // Customer groups
    const groupData = [{ groupName: 'عميل عادي' }, { groupName: 'عميل جملة' }];
    for (const g of groupData) {
      await CustomerGroup.findOneAndUpdate({ groupName: g.groupName }, { ...g, isActive: true }, { upsert: true });
    }

    // Expense categories
    const expCats = ['إيجار','رواتب','كهرباء وماء','صيانة','مواصلات','اتصالات','وقود','غذاء'];
    for (const name of expCats) {
      await ExpenseCategory.findOneAndUpdate({ categoryName: name }, { categoryName: name, isActive: true }, { upsert: true });
    }

    // Suppliers
    await Supplier.findOneAndUpdate({ supplierCode: 'SUPP-001' },
      { supplierCode: 'SUPP-001', supplierName: 'Gulf Chemicals Co.', isActive: true },
      { upsert: true });

    return NextResponse.json({ ok: true, message: 'تم إعادة بناء البيانات حسب تصنيفات SCI بنجاح! ✅' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
