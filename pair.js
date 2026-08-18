const express = require("express");
const fs = require("fs");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const mongoose = require("mongoose");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

function makeid(num = 4) {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < num; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

router.get("/", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.status(400).send({ error: "Phone number is required" });

  const id = makeid(5);
  const sessionPath = `./session_${id}`;

  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"],
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);

      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection === "open") {
          try {
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            await RobinPairWeb.sendMessage(user_jid, {
              image: {
                url: "https://raw.githubusercontent.com/REMEMBER-NK/Bot-helpur/refs/heads/main/31322071b2dd4757a80b264729c42ee7.png",
              },
              caption: "⏳ *ඔබගේ Bot සැකසෙමින් පවතී...*\n\nකරුණාකර තත්පර කිහිපයක් රැඳී සිටින්න.",
            });

            await delay(3000);

            // Session data read
            const credsData = JSON.parse(fs.readFileSync(`${sessionPath}/creds.json`, "utf-8"));
            
            // Safe Database Save Logic (BOT-RUNNER එකේ Index.js එකට 100% ගැලපෙන විදිහට)
            try {
              const mongoUri = process.env.MONGODB;
              if (mongoUri) {
                if (mongoose.connection.readyState !== 1) {
                  await mongoose.connect(mongoUri);
                }
                
                // PUSH DIRECTLY WITH 'creds' KEY
                await mongoose.connection.db.collection('sessions').updateOne(
                  { id: "main_session" },
                  { $set: { id: "main_session", creds: credsData } },
                  { upsert: true }
                );
                console.log("✅ Auto Verify Data Push to MongoDB Success!");
              }
            } catch (dbErr) {
              console.log("Database Save Warning:", dbErr.message);
            }

            // Message Sent
            await RobinPairWeb.sendMessage(user_jid, { 
              text: "✅ *ඔබගේ Bot සාර්ථකව Verify විය!*\n\n ටිකකින් Bot Auto Connect වෙයි." 
            });

          } catch (e) {
            console.error("Pairing Error:", e);
          } finally {
            await delay(2000);
            RobinPairWeb.ws.close();
            removeFile(sessionPath);
          }
        } else if (
          connection === "close" &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await delay(3000);
          RobinPair();
        }
      });
    } catch (err) {
      console.error(err);
      removeFile(sessionPath);
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }

  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
});

module.exports = router;
