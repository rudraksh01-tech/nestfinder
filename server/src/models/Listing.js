import mongoose from 'mongoose';

const { Schema } = mongoose;

const listingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. NF-001
    isDemo: { type: Boolean, default: true },
    broker: { type: Schema.Types.ObjectId, ref: 'Broker', index: true },
    locality: { type: String, required: true, index: true },
    // GeoJSON point ([lon, lat] order) so we can run $near queries later.
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    bhk: { type: Number, required: true, min: 1, max: 5 },
    sqft: { type: Number, required: true },
    rent: { type: Number, required: true, index: true },
    depositMonths: { type: Number, required: true },
    deposit: { type: Number, required: true },
    maintenance: { type: Number, default: 0 },
    furnishing: { type: String, enum: ['Unfurnished', 'Semi-furnished', 'Fully furnished'], required: true },
    buildingType: { type: String, enum: ['Gated society', 'Standalone building', 'Independent house'], required: true },
    floor: Number,
    totalFloors: Number,
    tenantPreference: { type: String, enum: ['Family', 'Bachelors', 'Any'], required: true },
    petsAllowed: { type: Boolean, default: false },
    parking: { type: String, enum: ['Car', 'Bike only', 'None'], default: 'None' },
    amenities: [String],
    waterSource: String,
    noise: { type: String, enum: ['low', 'medium', 'high'] },
    availableFrom: Date,
    nearestMetro: { name: String, lines: [String], km: Number },
    techParks: [{ _id: false, name: String, km: Number }], // straight-line km, approximate
    description: String,
  },
  { timestamps: true },
);

listingSchema.index({ location: '2dsphere' });

export const Listing = mongoose.model('Listing', listingSchema);
