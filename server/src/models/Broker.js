import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const brokerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    agency: { type: String, trim: true, maxlength: 80 },
    telegramChatId: String, // set when the broker connects the Telegram bot
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

brokerSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};
brokerSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Never send the password hash to the client.
brokerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const Broker = mongoose.model('Broker', brokerSchema);
