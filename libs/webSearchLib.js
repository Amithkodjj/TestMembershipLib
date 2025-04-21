let libPrefix = "webSearchLib";
let API_URL = "https://api.langsearch.com/v1/web-search"; // Replace with your actual free web search API

// === API KEY SET/GET ===
function setApiKey(key) {
  Bot.setProperty(libPrefix + "_apikey", key, "string");
}

function getApiKey() {
  let key = Bot.getProperty(libPrefix + "_apikey");
  if (!key) throw new Error("WebSearchLib: API key not set. Use setApiKey() to set your key.");
  return key;
}

// === PERFORM SEARCH REQUEST ===
function ask(options) {
  if (!options || !options.prompt) throw "WebSearchLib: 'prompt' (search query) is required";

  let key = getApiKey();

  let body = {
    query: options.prompt
  };

  Bot.setProperty(libPrefix + "_ctx_" + user.id, options, "json");

  HTTP.post({
    url: API_URL,
    body: body,
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json"
    },
    success: libPrefix + "_onSearchSuccess",
    error: libPrefix + "_onError"
  });
}

// === HANDLE SEARCH RESULT ===
function onSearchSuccess() {
  let res;
  try {
    res = JSON.parse(content);
  } catch (e) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*WebSearchLib Error:* Failed to parse API response. It might not be valid JSON.",
      parse_mode: "Markdown"
    });
    return;
  }

  let results = res?.results;
  if (!results || results.length === 0) {
    Api.sendMessage({
      chat_id: user.telegramid,
      text: "*WebSearchLib Notice:* No results found for your query.",
      parse_mode: "Markdown"
    });
    return;
  }

  let message = "*Web Search Results:*\n\n";
  results.forEach((item, index) => {
    message += `${index + 1}. [${item.title}](${item.url})\n`;
  });

  Api.sendMessage({
    chat_id: user.telegramid,
    text: message,
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
    text: "*WebSearchLib API Error:*\n`" + message + "`",
    parse_mode: "Markdown"
  });
}

// === EXPORT FUNCTIONS ===
publish({
  setApiKey: setApiKey,
  ask: ask
});

// === REGISTER EVENTS ===
on(libPrefix + "_onSearchSuccess", onSearchSuccess);
on(libPrefix + "_onError", onError);
