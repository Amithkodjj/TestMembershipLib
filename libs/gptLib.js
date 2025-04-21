let libPrefix = "gptLib";
let API_URL = "https://api.openai.com/v1/";

// ========== API KEY FUNCTIONS ==========
function setApiKey(key) {
  Bot.setProperty(libPrefix + "_apikey", key, "string");
}

function getApiKey() {
  let key = Bot.getProperty(libPrefix + "_apikey");
  if (!key) throw new Error("GPTLib: API key not set. Use setApiKey()");
  return key;
}

// ========== ASK GPT ==========
function ask(options) {
  if (!options || !options.prompt) throw "GPTLib: 'prompt' is required";

  let key = getApiKey();

  let body = {
    model: options.model || "gpt-3.5-turbo",
    messages: [{ role: "user", content: options.prompt }],
    temperature: options.temperature || 0.7
  };

  // Save for context (e.g. language, formatting)
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

// ========== IMAGE GENERATION ==========
function image(options) {
  if (!options || !options.prompt) throw "GPTLib: 'prompt' required for image generation";

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

// ========== HANDLE TEXT RESPONSE ==========
function onText() {
  let res = JSON.parse(content);
  let answer = res.choices[0].message.content;

  Bot.sendMessage("*ChatGPT Reply:*\n\n" + answer, { parse_mode: "Markdown" });
}

// ========== HANDLE IMAGE RESPONSE ==========
function onImage() {
  let res = JSON.parse(content);
  let img = res.data[0].url;

  Bot.sendMessage("*AI Image Generated:*", { parse_mode: "Markdown" });
  Bot.sendPhoto(img);
}

// ========== ERROR HANDLER ==========
function onError() {
  Bot.sendMessage("*GPTLib Error:*\n`" + content + "`", { parse_mode: "Markdown" });
}

// ========== EXPORT FOR LIBS ==========
publish({
  setApiKey: setApiKey,
  ask: ask,
  image: image
});

// ========== REGISTER EVENTS ==========
on(libPrefix + "_onText", onText);
on(libPrefix + "_onImage", onImage);
on(libPrefix + "_onError", onError);
