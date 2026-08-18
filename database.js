const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB || process.env.MONGO_URI || "mongodb://gamingkolla788_db_user:QJ7VrzsikZba7QV@cluster0-shard-00-00.imw2kqu.mongodb.net:27017,cluster0-shard-00-01.imw2kqu.mongodb.net:27017,cluster0-shard-00-02.imw2kqu.mongodb.net:27017/?ssl=true&replicaSet=atlas-13o89e-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ DB Connection Error:", err));

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sessionData: { type: Object, required: true }
});

const Session = mongoose.model("Session", SessionSchema);

module.exports = { Session };
