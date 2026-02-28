export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "No TELEGRAM_BOT_TOKEN" });
  }

  const update = req.body;
  const message = update.message || update.edited_message;
  if (!message) {
    return res.status(200).send("OK");
  }

  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text.startsWith("/start")) {
    const webAppUrl = "https://nutrilab-store.vercel.app";

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Добро пожаловать в NutriLab Store 🚀",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Открыть магазин",
                web_app: { url: webAppUrl }
              }
            ]
          ]
        }
      })
    });
  }

  return res.status(200).send("OK");
}
