import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  customerCode: { type: String, unique: true },
  customerName: { type: String, required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerGroup' },
  phone: { type: String },
  phone2: { type: String },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  taxNumber: { type: String },
  creditLimit: { type: Number, default: 0 },
  currentBalance: { type: Number, default: 0 }, // positive = owes us
  notes: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

CustomerSchema.pre('save', async function(next) {
  if (!this.customerCode) {
    const count = await this.constructor.countDocuments();
    this.customerCode = `CUST-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
