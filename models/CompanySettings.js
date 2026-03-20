import mongoose from 'mongoose';

const CompanySettingsSchema = new mongoose.Schema({
  companyName: { type: String, required: true, default: 'Sudanese Chemical Industries' },
  companyNameAr: { type: String, default: 'الصناعات الكيميائية السودانية' },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  website: { type: String },
  taxNumber: { type: String },
  taxRate: { type: Number, default: 0 },
  currency: { type: String, default: 'SDG' },
  currencyCode: { type: String, default: 'SDG' },
  invoiceHeader: { type: String },
  invoiceFooter: { type: String },
}, { timestamps: true });

export default mongoose.models.CompanySettings || mongoose.model('CompanySettings', CompanySettingsSchema);
