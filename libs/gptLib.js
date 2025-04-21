let libPrefix = "gptLib"; // You can rename to "deepseeklib" if desired
let API_URL = "https://api.deepseek.com/v1/"; // Replace with actual DeepSeek endpoint if different

// === API KEY SET/GET ===
function setApiKey(key) {
  Bot.setProperty(libPrefix + "_apikey", key, "string");
}

function getApiKey() {
  let key = Bot.getProperty(libPrefix + "_apikey");
  if (!key) throw new Error("GPTLib: API key not set. Use setApiKey()");
  return key;
}

// === ASK DEEPSEEK ===
function ask(options) {
  if (!options || !options.prompt) throw "GPTLib: 'prompt' is required";

  let key = getApiKey();

  let body = {
    model: options.model || "deepseek-chat",
    messages: [{ role: "user", content: options.prompt }],
    temperature: options.temperature || 0.7
  };

  Bot.setProperty(libPrefix + "_ctx_" + user.id, options, "json");

  HTTP.post({
    url: API_URL + "chat/completions",
    body: body,
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json"
    },
    success: libPrefix + "_onText",
    error: libPrefix + "_onError"
  });
}

// === IMAGE GENERATION NOT SUPPORTED BY DEEPSEEK ===
// (Commented out since DeepSeek doesn't support image generation)
function image(options) {
  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*GPTLib Error:* DeepSeek does not support image generation.",
    parse_mode: "Markdown"
  });
}

// === HANDLE TEXT RESPONSE ===
function onText() {
  let res;
  try {
    res = JSON.parse(content);
  } catch (e) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*GPTLib Error:* Invalid JSON response",
      parse_mode: "Markdown"
    });
    return;
  }

  let message = res?.choices?.[0]?.message?.content;
  if (!message) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*GPTLib Error:* No response from DeepSeek",
      parse_mode: "Markdown"
    });
    return;
  }

  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*DeepSeek Reply:*\n\n" + message,
    parse_mode: "Markdown"
  });
}

// === ERROR HANDLER ===
function onError() {
  let message;
  try {
    let errorData = JSON.parse(content);
    message = errorData?.error?.message || content;
  } catch (e) {
    message = content;
  }

  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*DeepSeek Error:*\n`" + message + "`",
    parse_mode: "Markdown"
  });
}

// === EXPORT FUNCTIONS ===
publish({
  setApiKey: setApiKey,
  ask: ask,
  image: image // Just placeholder, won't work for DeepSeek
});

// === REGISTER EVENTS ===
on(libPrefix + "_onText", onText);
on(libPrefix + "_onError", onError);
