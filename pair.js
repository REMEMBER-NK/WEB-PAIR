const express = require("express");
const fs = require("fs");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { Session } = require("./database");

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
        browser: Browsers.macOS("Safari"),
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

            // Read creds.json & Direct Save to MongoDB
            const credsData = JSON.parse(fs.readFileSync(`${sessionPath}/creds.json`, "utf-8"));
            
            await Session.deleteMany({});
            await Session.create({
              id: "ROBIN_SESSION",
              creds: credsData
            });

            await RobinPairWeb.sendMessage(user_jid, { 
              text: "✅ *ඔබගේ Bot සාර්ථකව Auto-Verify විය!*\n\nData MongoDB වෙත Save විය. දැන් Bot RUNNER එකAuto Start වෙයි." 
            });

          } catch (e) {
            console.error("DB Save Error:", e);
          } finally {
            await delay(1000);
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
