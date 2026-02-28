export default async function handler(req, res) {
  // Telegram шлёт апдейты POST-запросом
  if (req.method !== "POST") return res.status(200).send("OK");

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(500).json({ error: "No TELEGRAM_BOT_TOKEN in env" });

    // Иногда body приходит строкой — подстрахуемся
    const update = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const msg = update?.message || update?.edited_message;
    if (!msg) return res.status(200).send("OK");

    const chatId = msg.chat?.id;
    const text = (msg.text || "").trim();

    // Твоя WebApp
    const webAppUrl = "https://nutrilab-store.vercel.app";

    // ----- /start -----
    if (text.startsWith("/start")) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
            "Добро пожаловать в NutriLab Store 🚀\n\n" +
            "Открывайте каталог и оформляйте заказ в 1–2 клика.",
          reply_markup: {
            inline_keyboard: [
              [{ text: "🛍 Открыть магазин", web_app: { url: webAppUrl } }],
            ],
          },
        }),
      });

      return res.status(200).send("OK");
    }

    // ----- /help (опционально) -----
    if (text.startsWith("/help")) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Нажмите «🛍 Открыть магазин» в меню или отправьте /start 🙂",
        }),
      });

      return res.status(200).send("OK");
    }

    // На любые другие сообщения — просто отправляем кнопку
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "Открыть каталог:",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛍 Открыть магазин", web_app: { url: webAppUrl } }],
          ],
        },
      }),
    });

    return res.status(200).send("OK");
  } catch (err) {
    // чтобы Telegram не долбил ретраями бесконечно, часто лучше всё равно вернуть 200
    return res.status(200).send("OK");
  }
}
