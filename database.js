const mongoose = require("mongoose");

// Clean Connection String
const MONGO_URI = process.env.MONGODB || process.env.MONGO_URI || "mongodb+srv://gamingkolla788_db_user:QJ7VrzsikZba7QV@cluster0.imw2kqu.mongodb.net/ROBIN-MD?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout fast if failed
})
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ DB Connection Error:", err.message));

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionData: { type: Object, required: true }
});

const Session = mongoose.model("Session", SessionSchema);

module.exports = { Session };
