import mongoose from 'mongoose';

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to server/.env');
  await mongoose.connect(uri);
  console.log(`MongoDB connected (${mongoose.connection.name})`);
}
