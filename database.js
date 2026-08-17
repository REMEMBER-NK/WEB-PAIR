const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://gamingkolla788_db_user:aTw7a2D1sg0qX0AA@cluster0.fmw2kqu.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionData: { type: Object, required: true }
});

const Session = mongoose.model("Session", SessionSchema);

module.exports = { Session };
