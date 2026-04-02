require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TWITTER_BEARER = process.env.TWITTER_BEARER;

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});

// webhook
app.post("/webhook", async (req, res) => {
    console.log("📩 وصل طلب");

    try {
        const msg = req.body.message;

        if (!msg || !msg.text) return res.sendStatus(200);

        const text = msg.text;

        // 🐦 نشر في تويتر
        await axios.post(
            "https://api.twitter.com/2/tweets",
            { text: text },
            {
                headers: {
                    "Authorization": `Bearer ${TWITTER_BEARER}`,
                    "Content-Type": "application/json"
                }
            }
        );

        // رد للمستخدم
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: msg.chat.id,
            text: "🐦 تم نشر التغريدة بنجاح"
        });

    } catch (err) {
        console.log("❌ خطأ تويتر:", err.response?.data || err.message);

        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: req.body.message.chat.id,
            text: "❌ صار خطأ في النشر"
        });
    }

    res.sendStatus(200);
});

app.listen(3000, () => console.log("🚀 Server running"));
