export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.WEBHOOK_SECRET;

    if (!token || !secret) {
      return res.status(500).json({ error: "Missing env variables" });
    }

    const update =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const msg = update?.message || update?.edited_message;
    if (!msg) return res.status(200).send("OK");

    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    const webAppUrl = "https://nutrilab-store.vercel.app";

    if (text.startsWith("/start")) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🚀 Добро пожаловать в NutriLab Store!\n\nОткрывайте каталог и оформляйте заказ в 1–2 клика.",
          reply_markup: {
            keyboard: [
              [
                {
                  text: "🛍 Магазин",
                  web_app: { url: webAppUrl }
                }
              ]
            ],
            resize_keyboard: true
          }
        })
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(200).send("OK"); // важно для Telegram
  }
}
