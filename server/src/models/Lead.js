import mongoose from 'mongoose';

const { Schema } = mongoose;

export const LEAD_STATUSES = ['new', 'contacted', 'visit_scheduled', 'closed'];

// An enquiry from a flat seeker. A lead with a visitDate is a visit booking.
const leadSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
    broker: { type: Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true },
    message: { type: String, trim: true, maxlength: 1000 },
    visitDate: Date,
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Lead = mongoose.model('Lead', leadSchema);
