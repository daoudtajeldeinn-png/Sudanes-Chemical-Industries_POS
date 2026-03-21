'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS' or 'RECIPES'
  const [recipes, setRecipes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, oRes, pRes, wRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/production'),
        fetch('/api/products'),
        fetch('/api/warehouses')
      ]);
      const [rData, oData, pData, wData] = await Promise.all([
        rRes.json(), oRes.json(), pRes.json(), wRes.json()
      ]);
      setRecipes(rData.recipes || []);
      setOrders(oData.orders || []);
      setProducts(pData.products || []);
      setWarehouses(wData.warehouses || []);
    } catch (err) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveRecipe = async () => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success('✅ تم حفظ الوصفة');
      setModal(null);
      loadData();
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
  };

  const handleStartProduction = async () => {
    const res = await fetch('/api/production', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success('🚀 تم بدء أمر الإنتاج');
      setModal(null);
      loadData();
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
  };

  const handleUpdateStatus = async (id, status, actualQty) => {
    const res = await fetch(`/api/production/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actualQty })
    });
    if (res.ok) {
      toast.success('✔️ تم تحديث الحالة والجرد');
      loadData();
    } else {
      const d = await res.json();
      toast.error(d.error);
    }
  };

  const addIngredient = () => {
    setForm(p => ({
      ...p,
      ingredients: [...(p.ingredients || []), { product: '', quantity: 0 }]
    }));
  };

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col gap-2">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚗️ إدارة الإنتاج والوصفات</h1>
            <p className="text-sm text-gray-500 mt-1">الربط الآلي بين المواد الخام والمنتج النهائي</p>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('ORDERS')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ORDERS' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📦 أوامر الإنتاج
          </button>
          <button onClick={() => setActiveTab('RECIPES')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'RECIPES' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📜 الوصفات (BOM)
          </button>
        </div>
      </div>

      {activeTab === 'RECIPES' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ingredients: [], standardBatchSize: 1000 }); setModal('addRecipe'); }} className="btn-primary">
              + إضافة وصفة جديدة
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(r => (
              <div key={r._id} className="card border-t-4 border-blue-600">
                <div className="flex justify-between mb-4">
                  <h3 className="font-bold text-lg text-blue-900">{r.finishedProduct?.productNameAr || r.finishedProduct?.productName}</h3>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">Standard: {fmt(r.standardBatchSize)}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 border-b pb-1 uppercase">المكونات (BOM)</p>
                  {r.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700">{ing.product?.productNameAr || ing.product?.productName}</span>
                      <span className="font-bold text-blue-600">{fmt(ing.quantity)} {ing.product?.unit?.unitCode}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setForm({ recipe: r._id, finishedProduct: r.finishedProduct?._id, plannedQty: r.standardBatchSize, warehouse: warehouses[0]?._id }); setModal('startOrder'); }} 
                  className="w-full mt-4 btn-secondary text-sm">
                  🚀 بدء تشغيلة إنتاج
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setForm({ ingredients: [], plannedQty: 1 }); setModal('startFreeOrder'); }} className="btn-primary">
              + إضافة أمر إنتاج حر (بدون وصفة)
            </button>
          </div>
          <div className="card p-0 overflow-hidden shadow-xl border-none">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-700">
                <th className="px-5 py-4">رقم التشغيلة</th>
                <th className="px-5 py-4">المنتج</th>
                <th className="px-5 py-4">الكمية المخططة</th>
                <th className="px-5 py-4">الكمية الفعلية</th>
                <th className="px-5 py-4">الحالة</th>
                <th className="px-5 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-bold text-indigo-700">{o.batchNumber}</td>
                  <td className="px-5 py-4">
                    <div className="font-bold">{o.finishedProduct?.productNameAr || o.finishedProduct?.productName || 'غير محدد'}</div>
                    <div className="text-[10px] text-gray-400">{o.recipe ? `${o.recipe.standardBatchSize} basis` : 'إنتاج حر'}</div>
                  </td>
                  <td className="px-5 py-4 font-bold">{fmt(o.plannedQty)}</td>
                  <td className="px-5 py-4 font-bold text-blue-600">{fmt(o.actualQty || 0)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      o.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      o.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {o.status === 'PENDING' ? 'قيد الانتظار' : o.status === 'IN_PROGRESS' ? 'قيد العمل' : 'مكتمل ✅'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {o.status === 'PENDING' && (
                      <button onClick={() => handleUpdateStatus(o._id, 'IN_PROGRESS')} className="text-blue-600 hover:underline text-xs">بدء العمل</button>
                    )}
                    {o.status === 'IN_PROGRESS' && (
                      <button onClick={() => { setForm({ ...o, actualQty: o.plannedQty }); setModal('completeOrder'); }} 
                        className="text-green-600 hover:underline text-xs font-bold">إتمام وتحديث الجرد</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* --- Modals (Simplified for context) --- */}
      {modal === 'addRecipe' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">📜 تعريف وصفة إنتاج (BOM)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">المنتج النهائي *</label>
                <select className="input-field" value={form.finishedProduct} onChange={e => setForm({...form, finishedProduct: e.target.value})}>
                  <option value="">اختر المنتج...</option>
                  {products.filter(p => p.productType === 'FINISHED_GOOD').map(p => <option key={p._id} value={p._id}>{p.productNameAr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">حجم التشغيلة القياسي (Standard Batch Size)</label>
                <input type="number" className="input-field" value={form.standardBatchSize} onChange={e => setForm({...form, standardBatchSize: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-400 border-b pb-1">المكونات المطلوبة</label>
                {form.ingredients?.map((ing, i) => (
                   <div key={i} className="flex gap-2">
                     <select className="input-field flex-1" value={ing.product} onChange={e => {
                        const newIng = [...form.ingredients];
                        newIng[i].product = e.target.value;
                        setForm({...form, ingredients: newIng});
                     }}>
                       <option value="">اختر مادة خام...</option>
                       {products.filter(p => p.productType !== 'FINISHED_GOOD').map(p => <option key={p._id} value={p._id}>{p.productNameAr}</option>)}
                     </select>
                     <input type="number" placeholder="الكمية" className="input-field w-32" value={ing.quantity} onChange={e => {
                        const newIng = [...form.ingredients];
                        newIng[i].quantity = e.target.value;
                        setForm({...form, ingredients: newIng});
                     }} />
                   </div>
                ))}
                <button onClick={addIngredient} className="text-blue-600 text-xs hover:underline">+ إضافة مادة أخرى</button>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleSaveRecipe} className="btn-primary flex-1">حفظ الوصفة</button>
                <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'startOrder' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4">🚀 بدء تشغيلة جديدة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">رقم التشغيلة (Batch Number) *</label>
                <input type="text" className="input-field" placeholder="مثلاً: B2024-001" value={form.batchNumber} onChange={e => setForm({...form, batchNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الكمية المخططة</label>
                <input type="number" className="input-field" value={form.plannedQty} onChange={e => setForm({...form, plannedQty: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المستودع (ليتم خصم المواد منه وإضافة المنتج إليه)</label>
                <select className="input-field" value={form.warehouse} onChange={e => setForm({...form, warehouse: e.target.value})}>
                   {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleStartProduction} className="btn-primary flex-1">تأكيد البدء</button>
                <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'completeOrder' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-green-700">✔️ إتمام التشغيلة</h2>
            <p className="text-sm text-gray-600 mb-4">تنبيه: سيقوم النظام الآن بخصم المواد الخام آلياً من المستودع وإضافة المنتج النهائي.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">الكمية الفعلية المنتجة</label>
                <input type="number" className="input-field" value={form.actualQty} onChange={e => setForm({...form, actualQty: e.target.value})} />
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => handleUpdateStatus(form._id, 'COMPLETED', form.actualQty)} className="btn-success flex-1">تحديث الجرد والإتمام</button>
                <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === 'startFreeOrder' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-bold mb-4">🚀 أمر إنتاج حر (بدون وصفة مسبقة)</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">المنتج النهائي *</label>
                  <select className="input-field" value={form.finishedProduct} onChange={e => setForm({...form, finishedProduct: e.target.value})}>
                    <option value="">اختر المنتج المُراد إنتاجه...</option>
                    {products.filter(p => p.productType === 'FINISHED_GOOD').map(p => <option key={p._id} value={p._id}>{p.productNameAr}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">رقم التشغيلة (Batch Number) *</label>
                  <input type="text" className="input-field" placeholder="مثلاً: B2024-001" value={form.batchNumber || ''} onChange={e => setForm({...form, batchNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الكمية المخططة لإنتاجها</label>
                  <input type="number" className="input-field" value={form.plannedQty || ''} onChange={e => setForm({...form, plannedQty: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">المستودع (للخصم والإضافة)</label>
                  <select className="input-field" value={form.warehouse} onChange={e => setForm({...form, warehouse: e.target.value})}>
                     {warehouses.map(w => <option key={w._id} value={w._id}>{w.warehouseName}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-400 border-b pb-1">المواد الخام المستهلكة (اختياري / حسب الحاجة)</label>
                {form.ingredients?.map((ing, i) => (
                   <div key={i} className="flex gap-2">
                     <select className="input-field flex-1" value={ing.product} onChange={e => {
                        const newIng = [...form.ingredients];
                        newIng[i].product = e.target.value;
                        setForm({...form, ingredients: newIng});
                     }}>
                       <option value="">اختر مادة خام...</option>
                       {products.filter(p => p.productType !== 'FINISHED_GOOD').map(p => <option key={p._id} value={p._id}>{p.productNameAr}</option>)}
                     </select>
                     <input type="number" placeholder="الكمية" className="input-field w-32" value={ing.quantity} onChange={e => {
                        const newIng = [...form.ingredients];
                        newIng[i].quantity = e.target.value;
                        setForm({...form, ingredients: newIng});
                     }} />
                   </div>
                ))}
                <button onClick={addIngredient} className="text-blue-600 text-xs hover:underline">+ إضافة مواد أخرى ستٌستهلك</button>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={handleStartProduction} className="btn-primary flex-1">بدء الإنتاج الحر</button>
                <button onClick={() => setModal(null)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
