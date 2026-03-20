import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  supplierCode: { type: String, unique: true },
  supplierName: { type: String, required: true },
  phone: { type: String },
  phone2: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String, default: 'Sudan' },
  taxNumber: { type: String },
  currentBalance: { type: Number, default: 0 }, // positive = we owe them
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

SupplierSchema.pre('save', async function(next) {
  if (!this.supplierCode) {
    const count = await this.constructor.countDocuments();
    this.supplierCode = `SUPP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
