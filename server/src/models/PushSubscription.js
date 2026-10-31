import mongoose from 'mongoose';

// One browser/device that agreed to receive push notifications for a broker.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    broker: { type: mongoose.Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true },
);

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
