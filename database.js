const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB Environment Variable is missing!");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ DB Connection Error:", err.message));
}

// Session Schema & Model
const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionData: { type: Object, required: true }
}, { strict: false });

const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);

module.exports = { Session };
