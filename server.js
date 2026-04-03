require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ── YouTube OAuth ──────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob"
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const youtube = google.youtube({ version: "v3", auth: oauth2Client });

// ── Telegram Bot ───────────────────────────────────────────────────────────
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply("مرحباً! أرسل فيديو وسأرفعه على يوتيوب تلقائياً 🎬")
);

bot.on("video", async (ctx) => {
  const msg = await ctx.reply("⏳ جاري تحميل الفيديو...");

  try {
    const video = ctx.message.video;
    const caption = ctx.message.caption || "فيديو من تيليغرام";

    // ── تحميل الفيديو من تيليغرام ─────────────────────────────────────
    const fileLink = await ctx.telegram.getFileLink(video.file_id);
    const videoPath = path.join("/tmp", `video_${Date.now()}.mp4`);

    const response = await axios({ url: fileLink.href, responseType: "stream" });
    const writer = fs.createWriteStream(videoPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    await ctx.telegram.editMessageText(
      ctx.chat.id, msg.message_id, null,
      "⬆️ جاري الرفع على يوتيوب..."
    );

    // ── رفع الفيديو على يوتيوب ────────────────────────────────────────
    const uploadRes = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: caption.slice(0, 100),
          description: caption,
          tags: ["telegram", "auto-post"],
          categoryId: "22",
        },
        status: {
          privacyStatus: process.env.VIDEO_PRIVACY || "public",
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    const videoId = uploadRes.data.id;
    const videoUrl = `https://youtube.com/watch?v=${videoId}`;

    await ctx.telegram.editMessageText(
      ctx.chat.id, msg.message_id, null,
      `✅ تم الرفع بنجاح!\n🎬 ${videoUrl}`
    );

    // حذف الملف المؤقت
    fs.unlinkSync(videoPath);
    console.log("✅ فيديو رُفع:", videoUrl);
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    await ctx.telegram.editMessageText(
      ctx.chat.id, msg.message_id, null,
      `❌ فشل الرفع: ${err.message}`
    );
  }
});

// فيديوهات القنوات
bot.on("channel_post", async (ctx) => {
  if (ctx.channelPost.video) {
    ctx.message = ctx.channelPost;
    await bot.handleUpdate({ ...ctx.update, message: ctx.channelPost });
  }
});

bot.launch().then(() => console.log("🤖 البوت يعمل..."));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
