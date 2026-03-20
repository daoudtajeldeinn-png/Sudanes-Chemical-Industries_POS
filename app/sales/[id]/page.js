'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function SaleDetailPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sales/${id}`).then(r => r.json()).then(d => { setSale(d.sale); setLoading(false); });
  }, [id]);

  const fmt = (n) => new Intl.NumberFormat('ar-SD').format(Math.round(n || 0));
  const statusLabel = { PAID: 'مدفوع', PARTIAL: 'جزئي', CREDIT: 'آجل', CANCELLED: 'ملغي' };
  const payLabel = { CASH: 'نقدي', CARD: 'بطاقة', CREDIT: 'آجل', TRANSFER: 'تحويل بنكي' };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">جاري التحميل...</div>;
  if (!sale) return <div className="p-6 text-red-500">الفاتورة غير موجودة</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between no-print">
        <Link href="/sales" className="text-blue-600 hover:underline text-sm">← العودة للفواتير</Link>
        <button onClick={() => window.print()} className="btn-secondary text-sm">🖨️ طباعة</button>
      </div>

      <div className="card space-y-6" id="invoice">
        <div className="text-center border-b pb-6">
          <div className="text-2xl font-bold text-blue-900">الصناعات الكيميائية السودانية</div>
          <div className="text-gray-500 text-sm mt-1">Sudanese Chemical Industries • SCI</div>
          <div className="text-3xl font-bold text-gray-800 mt-4">فاتورة بيع</div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex gap-2"><span className="text-gray-500 w-28">رقم الفاتورة:</span><span className="font-mono font-bold text-blue-600">{sale.invoiceNumber}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-28">التاريخ:</span><span>{new Date(sale.invoiceDate).toLocaleDateString('ar-SD', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-28">طريقة الدفع:</span><span>{payLabel[sale.paymentMethod] || sale.paymentMethod}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-28">الحالة:</span><span className={sale.status === 'PAID' ? 'badge-green' : 'badge-yellow'}>{statusLabel[sale.status]}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-28">الكاشير:</span><span>{sale.user?.fullName || '-'}</span></div>
          </div>
          <div className="space-y-1 border-r pr-4">
            <div className="font-semibold text-gray-700 mb-2">بيانات العميل:</div>
            <div className="font-bold text-lg">{sale.customerName || sale.customer?.customerName || 'نقدي'}</div>
            {sale.customer?.phone && <div className="text-gray-500">{sale.customer.phone}</div>}
            {sale.customer?.city && <div className="text-gray-500">{sale.customer.city}</div>}
            {sale.customer?.address && <div className="text-gray-500 text-xs">{sale.customer.address}</div>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                {['#','المنتج','الكمية','الوحدة','سعر الوحدة','الخصم','الإجمالي'].map((h,i) => (
                  <th key={i} className="text-right py-2 px-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-400">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{item.productName}</td>
                  <td className="py-2 px-3">{item.quantity}</td>
                  <td className="py-2 px-3 text-gray-600">{item.unit || '-'}</td>
                  <td className="py-2 px-3">{fmt(item.unitPrice)} SDG</td>
                  <td className="py-2 px-3 text-red-500">{item.discount > 0 ? `${fmt(item.discount)} SDG` : '-'}</td>
                  <td className="py-2 px-3 font-bold">{fmt(item.totalPrice)} SDG</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600">المجموع الفرعي</span><span>{fmt(sale.subTotal)} SDG</span></div>
            {sale.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>الخصم</span><span>- {fmt(sale.discountAmount)} SDG</span></div>}
            {sale.taxAmount > 0 && <div className="flex justify-between"><span>الضريبة</span><span>+ {fmt(sale.taxAmount)} SDG</span></div>}
            <div className="flex justify-between font-bold text-xl border-t-2 pt-3">
              <span>الإجمالي</span><span className="text-blue-700">{fmt(sale.totalAmount)} SDG</span>
            </div>
            <div className="flex justify-between text-gray-600"><span>المدفوع</span><span>{fmt(sale.paidAmount)} SDG</span></div>
            {sale.remainingAmount > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>المتبقي</span><span>{fmt(sale.remainingAmount)} SDG</span></div>}
          </div>
        </div>

        <div className="text-center text-gray-400 text-xs border-t pt-4">
          شكراً لتعاملكم معنا • Sudanese Chemical Industries POS
        </div>
      </div>
    </div>
  );
}
