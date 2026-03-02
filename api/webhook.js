const { createClient } = require("@supabase/supabase-js");

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sessions = new Map();

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML"
    })
  });
}

module.exports = async (req, res) => {
  const msg = req.body.message;
  if (!msg) return res.status(200).send("ok");

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!ADMIN_IDS.includes(String(userId))) {
    await sendMessage(chatId, "Нет доступа.");
    return res.status(200).send("ok");
  }

  if (text === "/add") {
    sessions.set(userId, { step: "name", data: {} });
    await sendMessage(chatId, "Введи название товара:");
    return res.status(200).send("ok");
  }

  const session = sessions.get(userId);
  if (!session) return res.status(200).send("ok");

  if (session.step === "name") {
    session.data.name = text;
    session.step = "price";
    await sendMessage(chatId, "Введи цену:");
    return res.status(200).send("ok");
  }

  if (session.step === "price") {
    session.data.price = Number(text);
    session.step = "description";
    await sendMessage(chatId, "Введи описание:");
    return res.status(200).send("ok");
  }

  if (session.step === "description") {
    session.data.description = text;
    session.step = "photo";
    await sendMessage(chatId, "Отправь фото товара:");
    return res.status(200).send("ok");
  }

  if (session.step === "photo" && msg.photo) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;

    const fileRes = await fetch(
      `https://api.telegram.org/bot${TG_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json();

    const filePath = fileData.result.file_path;

    const imageRes = await fetch(
      `https://api.telegram.org/file/bot${TG_TOKEN}/${filePath}`
    );
    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const fileName = `${Date.now()}.jpg`;

    await supabase.storage
      .from("product-images")
      .upload(fileName, buffer, { contentType: "image/jpeg" });

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    await supabase.from("products").insert([
      {
        name: session.data.name,
        price: session.data.price,
        description: session.data.description,
        image_url: data.publicUrl
      }
    ]);

    sessions.delete(userId);

    await sendMessage(chatId, "✅ Товар добавлен!");
  }

  res.status(200).send("ok");
};
