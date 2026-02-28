export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: "No TELEGRAM_BOT_TOKEN" });

  const update = req.body;

  // Берём message из апдейта
  const msg = update.message || update.edited_message;
  if (!msg) return res.status(200).send("OK");

  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();

  // Ответ на /start
  if (text.startsWith("/start")) {
    const webAppUrl = "https://nutrilab-store.vercel.app"; // твой Vercel URL

    const payload = {
      chat_id: chatId,
      text:
        "👋 Добро пожаловать в *NutriLab Store* 🛍\n\n" +
        "Откройте каталог и оформите заказ в 1–2 клика.\n" +
        "🚚 Доставка по РФ\n\n" +
        "Нажмите кнопку ниже 👇",
      parse_mode: "Markdown",
      reply_markup: {
        keyboard: [
          [{ text: "🛍 Открыть магазин", web_app: { url: webAppUrl } }],
          [{ text: "📦 Статус заказа" }, { text: "💬 Поддержка" }]
        ],
        resize_keyboard: true
      }
    };

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return res.status(200).send("OK");
  }

  // Простые ответы-заглушки (можно потом улучшать)
  if (text === "📦 Статус заказа") {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "📦 Напишите номер заказа — проверю статус."
      })
    });
    return res.status(200).send("OK");
  }

  if (text === "💬 Поддержка") {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "💬 Напишите ваш вопрос одним сообщением — мы ответим."
      })
    });
    return res.status(200).send("OK");
  }

  return res.status(200).send("OK");
}
