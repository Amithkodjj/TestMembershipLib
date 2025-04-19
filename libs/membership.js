// Get bot token
function getBotToken() {
  return bot.token;
}

// Check if bot is admin in channel using Telegram API directly
function isBotAdmin(channel, callback) {
  let botToken = getBotToken();
  let botId = user.telegramid; // Changed from user.telegramid to bot.id

  let chatUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channel}&user_id=${botId}`;
  
  HTTP.get(chatUrl, {}, function(err, response) {
    if (err) {
      callback({ ok: false, reason: "API request failed" });
      return;
    }
    
    try {
      let data = JSON.parse(response.content);
      let status = data.result.status;
      
      if (status === "administrator" || status === "creator") {
        callback({ ok: true });
      } else {
        callback({ ok: false, reason: `Bot is not admin in ${channel}` });
      }
    } catch (e) {
      callback({ ok: false, reason: "Failed to parse API response" });
    }
  });
}

// Check if user is in the channel
function isUserInChannel(channel, userId, callback) {
  let token = getBotToken();
  let url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${userId}`;

  HTTP.get(url, {}, function(err, response) {
    if (err) {
      callback(false);
      return;
    }
    
    try {
      let data = JSON.parse(response.content);
      let status = data.result.status;
      let isMember = ["member", "administrator", "creator"].includes(status);
      callback(isMember);
    } catch (e) {
      callback(false);
    }
  });
}

// Validate function
function validateMembership(params) {
  let channels = params.channels;
  let userId = params.user_id;
  let onCheck = params.onCheck;

  if (!channels || !userId || !onCheck) {
    return Bot.sendMessage("Missing required parameters in Libs.membership.validate()");
  }

  // Step 1: Check all bot admins
  let i = 0;
  function checkBotNext() {
    if (i >= channels.length) return checkUser();

    isBotAdmin(channels[i], function(result) {
      if (!result.ok) {
        return onCheck({
          status: false,
          is_joined: false,
          error_message: result.reason
        });
      }
      i++;
      checkBotNext();
    });
  }

  // Step 2: Check if user joined all
  let j = 0;
  function checkUser() {
    if (j >= channels.length) return onCheck({ status: true, is_joined: true });

    isUserInChannel(channels[j], userId, function(joined) {
      if (!joined) {
        return onCheck({
          status: true,
          is_joined: false,
          error_message: channels[j]
        });
      }
      j++;
      checkUser();
    });
  }

  checkBotNext();
}

// Export
publish({
  validate: validateMembership
});
