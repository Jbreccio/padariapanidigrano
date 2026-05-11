import mongoose from 'mongoose';

const prayerRequestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  prayerRequest: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'prayer_request'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 dias em segundos (7 * 24 * 60 * 60)
  }
});

const candleSchema = new mongoose.Schema({
  id: {
    type: Number,
    default: () => Date.now()
  },
  name: {
    type: String,
    required: true
  },
  intention: {
    type: String,
    required: true
  },
  cityState: {
    type: String,
    required: true
  },
  timestamp: {
    type: String,
    default: "Agora"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 dias em segundos - REMOÇÃO AUTOMÁTICA!
  }
});

export const PrayerRequest = mongoose.model('PrayerRequest', prayerRequestSchema);
export const Candle = mongoose.model('Candle', candleSchema);