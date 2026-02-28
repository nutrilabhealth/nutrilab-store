export default async function handler(req, res) {
  // Telegram шлёт POST
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "No TELEGRAM_BOT_TOKEN in env" });

    const update = req.body || {};

    // Поддержим разные типы апдейтов
    const msg = update.message || update.edited_message;
    const callback = update.callback_query;

    // 1) Команды / текстовые сообщения
    if (msg) {
      const chatId = msg.chat?.id;
      const text = (msg.text || "").trim();

      // Если нет chatId — просто ок
      if (!chatId) return res.status(200).send("OK");

      if (text.startsWith("/start")) {
        const webAppUrl = "https://nutrilab-store.vercel.app";

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Добро пожаловать в NutriLab Store 🚀\nНажмите кнопку ниже, чтобы открыть магазин.",
            reply_markup: {
              inline_keyboard: [[{ text: "🛍 Открыть магазин", web_app: { url: webAppUrl } }]],
            },
          }),
        });
      }

      // Важно: всегда отвечаем Telegram 200
      return res.status(200).send("OK");
    }

    // 2) Нажатия на inline-кнопки (callback_query)
    if (callback) {
      const callbackId = callback.id;

      // Можно просто подтверждать, чтобы не было "loading"
      if (callbackId) {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: callbackId }),
        });
      }

      return res.status(200).send("OK");
    }

    // 3) Всё остальное игнорируем (но отвечаем 200!)
    return res.status(200).send("OK");
  } catch (err) {
    // Чтобы Telegram не ретраил бесконечно — можно всё равно вернуть 200
    // но для отладки оставим 200 + лог
    console.error("Webhook error:", err);
    return res.status(200).send("OK");
  }
}
