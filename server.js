require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TWITTER_BEARER = process.env.TWITTER_BEARER;

// webhook
app.post("/webhook", async (req, res) => {
    try {
        const msg = req.body.message;

        if (!msg || !msg.text) return res.sendStatus(200);

        const text = msg.text;

        // إرسال إلى تويتر
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

        // رد في تيليجرام
        await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: msg.chat.id,
            text: "✅ تم نشر التغريدة بنجاح"
        });

        res.sendStatus(200);
    } catch (err) {
        console.log(err.response?.data || err.message);
        res.sendStatus(200);
    }
});

app.get("/", (req, res) => {
    res.send("Bot is running 🚀");
});

app.listen(3000, () => console.log("Server running on port 3000"));
