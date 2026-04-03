require("dotenv").config();
const { Telegraf } = require("telegraf");
const { TwitterApi } = require("twitter-api-v2");

// ── Twitter client ─────────────────────────────────────────────────────────
const twitter = new TwitterApi({
  appKey: process.env.TWITTER_CONSUMER_KEY,
  appSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// ── Telegram bot ───────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// تقسيم النص إذا تجاوز 280 حرف
function chunkText(text, size = 280) {
  const words = text.split(" ");
  const chunks = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= size) {
      current = (current + " " + word).trim();
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }
  if (current) chunks.push(current);
  return chunks.length ? chunks : [""];
}

// معالج الرسائل
async function handleText(ctx) {
  const text = ctx.message?.text || ctx.channelPost?.text;
  if (!text) return;

  console.log("📨 رسالة جديدة:", text.slice(0, 60));

  const chunks = chunkText(text);
  let replyToId = null;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const params = {};
      if (replyToId) params.reply = { in_reply_to_tweet_id: replyToId };

      const tweet = await twitter.v2.tweet(chunks[i], params);
      replyToId = tweet.data.id;
      console.log(`✅ تغريدة ${i + 1}/${chunks.length} → id=${replyToId}`);
    } catch (err) {
      console.error(`❌ خطأ في التغريدة ${i + 1}:`, err.message);
      break;
    }
  }
}

bot.on("text", handleText);
bot.on("channel_post", handleText);

bot.launch().then(() => console.log("🤖 البوت يعمل..."));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
