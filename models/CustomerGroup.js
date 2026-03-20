import mongoose from 'mongoose';

const CustomerGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  discountRate: { type: Number, default: 0 }, // percentage
  creditLimit: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export default mongoose.models.CustomerGroup || mongoose.model('CustomerGroup', CustomerGroupSchema);
