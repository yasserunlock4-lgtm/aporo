require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");

const app = express();
app.use(express.json());

// 🔹 Telegram
const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 🔹 Twitter
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const rwClient = twitterClient.readWrite;

// ✅ الصفحة الرئيسية
app.get("/", (req, res) => {
  res.send("Bot is running 🚀");
});

// 🔥 webhook
app.post("/webhook", async (req, res) => {
  console.log("📩 رسالة وصلت");

  try {
    const msg = req.body.message;

    if (!msg || !msg.text) return res.sendStatus(200);

    const text = msg.text;

    // 🐦 نشر في تويتر
    await rwClient.v2.tweet(text);

    // 📩 رد في تيليجرام
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: msg.chat.id,
      text: "🐦 تم نشر التغريدة بنجاح"
    });

  } catch (err) {
    console.log("❌ خطأ تويتر:", err);

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: req.body.message.chat.id,
      text: "❌ فشل النشر في تويتر"
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});
