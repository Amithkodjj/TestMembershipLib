let libPrefix = "chatGPT";
let API_URL = "https://api.openai.com/v1/";

// === API KEY SET/GET ===
function setApiKey(key) {
  Bot.setProperty(libPrefix + "_apikey", key, "string");
  Bot.sendMessage("Setup - SUCCESS, you need to add billing option then only it will work ")
}

function getApiKey() {
  let key = Bot.getProperty(libPrefix + "_apikey");
  if (!key) throw new Error("GPTLib: API key not set. Use setApiKey(), get api key from https://platform.openai.com/api-keys");
  return key;
}

// === ASK CHATGPT ===
function ask(options) {
  if (!options || !options.prompt) throw "GPTLib: 'prompt' is required";

  let key = getApiKey();

  let body = {
    model: options.model || "gpt-3.5-turbo",
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

// === GENERATE IMAGE ===
function image(options) {
  if (!options || !options.prompt) throw "GPTLib: 'prompt' is required";

  let key = getApiKey();

  let body = {
    prompt: options.prompt,
    n: 1,
    size: options.size || "512x512"
  };

  Bot.setProperty(libPrefix + "_ctx_" + user.id, options, "json");

  HTTP.post({
    url: API_URL + "images/generations",
    body: body,
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json"
    },
    success: libPrefix + "_onImage",
    error: libPrefix + "_onError"
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
      text: "*GPTLib Error:* No response from ChatGPT",
      parse_mode: "Markdown"
    });
    return;
  }

  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*ChatGPT Reply:*\n\n" + message,
    parse_mode: "Markdown"
  });
}

// === HANDLE IMAGE RESPONSE ===
function onImage() {
  let res;
  try {
    res = JSON.parse(content);
  } catch (e) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*GPTLib Error:* Invalid JSON in image response",
      parse_mode: "Markdown"
    });
    return;
  }

  let img = res?.data?.[0]?.url;
  if (!img) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*GPTLib Error:* Image URL not received",
      parse_mode: "Markdown"
    });
    return;
  }

  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*AI Image Generated:*",
    parse_mode: "Markdown"
  });

  Api.sendPhoto({
    chat_id: user.telegramid,
    photo: img
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
    text: "*GPTLib Error:*\n`" + message + "`",
    parse_mode: "Markdown"
  });
}

// === EXPORT FUNCTIONS ===
publish({
  setApiKey: setApiKey,
  ask: ask,
  image: image
});

// === REGISTER EVENTS ===
on(libPrefix + "_onText", onText);
on(libPrefix + "_onImage", onImage);
on(libPrefix + "_onError", onError);
Can u make this as deepseek api 
