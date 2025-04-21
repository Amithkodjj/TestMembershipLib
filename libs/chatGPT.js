let libPrefix = "chatGPT";
let API_URL = "https://api.openai.com/v1/";

// === API KEY SET/GET ===
function setApiKey(key) {
  Bot.setProperty(libPrefix + "_apikey", key, "string");
  Bot.sendMessage("Setup - SUCCESS, you need to add billing option then only it will work - https://platform.openai.com/settings/organization/billing/overview ");
}

function getApiKey() {
  let key = Bot.getProperty(libPrefix + "_apikey");
  if (!key) throw new Error("GPTLib: API key not set. Use setApiKey(), get API key from https://platform.openai.com/api-keys");
  return key;
}

// Permanent Instructions for ChatGPT (No need to provide every time)
const instructions = "Please format all responses in Markdown. If the answer is code, wrap it in code blocks using '```'. For non-code answers, provide clear and concise explanations.";

// === ASK OPENAI ===
function ask(options) {
  if (!options || !options.input) throw "GPTLib: 'input' is required";

  let key = getApiKey();

  let body = {
    model: options.model || "gpt-3.5-turbo",  // Default model set to GPT-3.5
    messages: [
      { role: "system", content: instructions },  // Permanent instructions
      { role: "user", content: options.input }    // User input
    ],
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
  if (!options || !options.input) throw "GPTLib: 'input' is required";

  let key = getApiKey();

  let body = {
    input: options.input,  // Using 'input' to replace 'prompt'
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
      text: "*GPTLib Error:* No response from OpenAI",
      parse_mode: "Markdown"
    });
    return;
  }

  // Format the message with Markdown for Telegram (and code block if applicable)
  Api.sendMessage({
    chat_id: user.telegramid,
    text: "*ChatGPT Reply:*\n\n" + "```" + message + "```", // Wrapping response in code block
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
    text: "*GPTLib Error:*\n`" + message + "`", // Error message formatted in code block
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
