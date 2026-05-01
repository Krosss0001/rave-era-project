type TelegramInlineButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

type TelegramReplyButton = {
  text: string;
  request_contact?: boolean;
};

type SendMessageOptions = {
  inlineKeyboard?: TelegramInlineButton[][];
  replyKeyboard?: TelegramReplyButton[][];
  removeKeyboard?: boolean;
  parseMode?: "HTML" | null;
};

type SendPhotoOptions = SendMessageOptions & {
  caption?: string;
};

function getBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

async function telegramApi<T>(method: string, payload: Record<string, unknown>): Promise<T | null> {
  const token = getBotToken();

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Telegram API ${method} failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function telegramFormApi<T>(method: string, payload: FormData): Promise<T | null> {
  const token = getBotToken();

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    body: payload,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Telegram API ${method} failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function getReplyMarkup(options: SendMessageOptions) {
  if (options.inlineKeyboard) {
    return { inline_keyboard: options.inlineKeyboard };
  }

  if (options.replyKeyboard) {
    return {
      keyboard: options.replyKeyboard,
      resize_keyboard: true,
      one_time_keyboard: true
    };
  }

  if (options.removeKeyboard) {
    return { remove_keyboard: true };
  }

  return undefined;
}

export async function sendTelegramMessage(chatId: string, text: string, options: SendMessageOptions = {}) {
  const parseMode = options.parseMode === undefined ? "HTML" : options.parseMode;

  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    ...(parseMode ? { parse_mode: parseMode } : {}),
    disable_web_page_preview: true,
    reply_markup: getReplyMarkup(options)
  });
}

export async function sendTelegramPhoto(chatId: string, photoUrl: string, options: SendPhotoOptions = {}) {
  return telegramApi("sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption: options.caption,
    parse_mode: "HTML",
    reply_markup: getReplyMarkup(options)
  });
}

export async function sendTelegramPhotoDataUrl(chatId: string, dataUrl: string, options: SendPhotoOptions = {}) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid Telegram photo data URL.");
  }

  const [, mimeType, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();

  form.set("chat_id", chatId);
  form.set("photo", new Blob([bytes], { type: mimeType }), "ticket-qr.png");
  form.set("parse_mode", "HTML");

  if (options.caption) {
    form.set("caption", options.caption);
  }

  const replyMarkup = getReplyMarkup(options);

  if (replyMarkup) {
    form.set("reply_markup", JSON.stringify(replyMarkup));
  }

  return telegramFormApi("sendPhoto", form);
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text
  });
}
