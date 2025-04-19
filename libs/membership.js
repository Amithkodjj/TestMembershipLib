// Membership validation library
function getBotToken() {
  return bot.token; // Make sure your bot has this property
}

function isBotAdmin(channel, callback) {
  const botToken = getBotToken();
  const botId = user.telegramid; // The bot's own user ID

  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channel}&user_id=${botId}`;
  
  HTTP.get(url, {}, (err, response) => {
    if (err) {
      callback({ ok: false, reason: "Failed to check bot admin status" });
      return;
    }
    
    try {
      const data = JSON.parse(response.content);
      if (data.ok) {
        const status = data.result.status;
        callback({ 
          ok: ["administrator", "creator"].includes(status),
          reason: status === "administrator" || status === "creator" 
            ? null 
            : `Bot needs admin rights in ${channel}`
        });
      } else {
        callback({ ok: false, reason: data.description || "Unknown Telegram API error" });
      }
    } catch (e) {
      callback({ ok: false, reason: "Invalid API response" });
    }
  });
}

function isUserInChannel(channel, userId, callback) {
  const token = getBotToken();
  const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${channel}&user_id=${userId}`;

  HTTP.get(url, {}, (err, response) => {
    if (err) {
      callback(false);
      return;
    }
    
    try {
      const data = JSON.parse(response.content);
      const status = data.result?.status;
      callback(["member", "administrator", "creator"].includes(status));
    } catch (e) {
      callback(false);
    }
  });
}

function validateMembership(params) {
  const { channels, user_id, onCheck } = params;

  if (!channels || !user_id || !onCheck) {
    throw new Error("Missing required parameters");
  }

  // Check bot admin status first
  (function checkNextBotAdmin(index) {
    if (index >= channels.length) return checkUserMembership(0);
    
    isBotAdmin(channels[index], (result) => {
      if (!result.ok) {
        return onCheck({
          status: false,
          is_joined: false,
          error_message: result.reason || `Bot is not admin in ${channels[index]}`
        });
      }
      checkNextBotAdmin(index + 1);
    });
  })(0);

  // Then check user membership
  function checkUserMembership(index) {
    if (index >= channels.length) {
      return onCheck({ status: true, is_joined: true });
    }

    isUserInChannel(channels[index], user_id, (isMember) => {
      if (!isMember) {
        return onCheck({
          status: true,
          is_joined: false,
          error_message: channels[index]
        });
      }
      checkUserMembership(index + 1);
    });
  }
}

publish({
  validate: validateMembership
});
