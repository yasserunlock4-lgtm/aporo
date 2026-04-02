require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// اختبار الصفحة الرئيسية
app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});

// webhook
app.post("/webhook", async (req, res) => {
    console.log("📩 وصل طلب من تيليجرام");

    try {
        const msg = req.body.message;

        if (!msg) return res.sendStatus(200);

        // رد بسيط
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: msg.chat.id,
            text: "🔥 البوت شغال 100%"
        });

    } catch (err) {
        console.log("❌ خطأ:", err.message);
    }

    res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Server running"));
