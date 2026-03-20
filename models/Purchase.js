import mongoose from 'mongoose';

const PurchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productCode: { type: String },
  productName: { type: String },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalCost: { type: Number, required: true },
  batchId: { type: mongoose.Schema.Types.ObjectId, default: null }, // v3.1
  notes: { type: String },
});

const PurchaseSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  supplierInvoice: { type: String }, // supplier's own invoice number
  invoiceDate: { type: Date, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  supplierName: { type: String },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [PurchaseItemSchema],
  subTotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['CASH', 'CARD', 'CREDIT', 'TRANSFER'], default: 'CASH' },
  status: { type: String, enum: ['PAID', 'PARTIAL', 'CREDIT', 'CANCELLED'], default: 'PAID' },
  purchaseCategory: { type: String, enum: ['RAW_MATERIAL', 'PACKAGING', 'FUEL', 'FOOD', 'EXPENSE', 'OTHER'], default: 'RAW_MATERIAL' },
  currency: { type: String, enum: ['SDG', 'USD'], default: 'SDG' },
  exchangeRate: { type: Number, default: 1 },
  notes: { type: String },
}, { timestamps: true });

PurchaseSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `PUR-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
