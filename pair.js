const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys");
const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const mongoose = require("mongoose");

const router = express.Router();

function removeFile(FilePath) {
    if (fs.existsSync(FilePath)) {
        fs.rmSync(FilePath, { recursive: true, force: true });
    }
}

router.get("/", async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).send({ error: "Please provide a phone number" });

    const sessionDir = path.join(__dirname, './session');
    removeFile(sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    try {
        const RememberPair = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"]
        });

        if (!RememberPair.authState.creds.registered) {
            await delay(1500);
            num = num.replace(/[^0-9]/g, '');
            const code = await RememberPair.requestPairingCode(num);
            if (!res.headersSent) {
                res.send({ code });
            }
        }

        RememberPair.ev.on("creds.update", saveCreds);

        RememberPair.ev.on("connection.update", async (s) => {
            const { connection } = s;
            if (connection === "open") {
                await delay(10000);
                
                try {
                    const mongoUri = process.env.MONGODB;
                    if (mongoUri) {
                        if (mongoose.connection.readyState !== 1) {
                            await mongoose.connect(mongoUri);
                        }
                        
                        const credsPath = path.join(sessionDir, 'creds.json');
                        if (fs.existsSync(credsPath)) {
                            const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
                            await mongoose.connection.db.collection('sessions').updateOne(
                                { id: "main_session" },
                                { $set: { id: "main_session", sessionData: credsData } },
                                { upsert: true }
                            );
                            console.log("✅ Session Data MongoDB එකට Save වුණා!");
                        }
                    }
                } catch (dbErr) {
                    console.log("❌ DB Save Error:", dbErr.message);
                }

                removeFile(sessionDir);
            }
        });

    } catch (err) {
        console.log("Pairing Error:", err);
        if (!res.headersSent) {
            res.status(500).send({ error: "Pairing Failed" });
        }
    }
});

module.exports = router;
