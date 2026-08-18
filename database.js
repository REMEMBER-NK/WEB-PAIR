const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB || process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ DB Connection Error:", err.message));
}

// Strict false කරලා ඕනෑම Schema structure එකක් save වෙන්න හදපු එක
const SessionSchema = new mongoose.Schema({
  id: { type: String, default: "ROBIN_SESSION" },
  creds: { type: Object }
}, { strict: false });

const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);

module.exports = { Session };
