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
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
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

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text
  });
}
