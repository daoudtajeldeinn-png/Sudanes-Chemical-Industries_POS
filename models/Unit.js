import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema({
  unitName: { type: String, required: true },
  unitCode: { type: String, required: true, uppercase: true },
  isActive: { type: Boolean, default: true },
});

export default mongoose.models.Unit || mongoose.model('Unit', UnitSchema);
