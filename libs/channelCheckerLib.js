function isBotAdmin(chatId) {
  const botToken = bot.token;
  const botId = user.telegramid;
  const url = "https://api.telegram.org/bot" + botToken + "/getChatMember?chat_id=" + chatId + "&user_id=" + botId;

  return HTTP.get(url, { json: true }).then(function(r) {
    if (!r || !r.result) return false;
    let status = r.result.status;
    return status === "administrator" || status === "creator";
  }).catch(function(e) {
    return false;
  });
}

function isUserJoinedChannel(chatId) {
  const botToken = bot.token;
  const userId = user.telegramid;
  const url = "https://api.telegram.org/bot" + botToken + "/getChatMember?chat_id=" + chatId + "&user_id=" + userId;

  return HTTP.get(url, { json: true }).then(function(r) {
    if (!r || !r.result) return false;
    let status = r.result.status;
    return ["member", "administrator", "creator"].includes(status);
  }).catch(function(e) {
    return false;
  });
}

function checkUserInAllChannels(channels, onSuccess, onFail) {
  var isAdmin = true;
  var isJoined = true;
  var index = 0;

  function nextCheck() {
    if (index >= channels.length) {
      if (!isAdmin) {
        onFail({ error_message: "❌ Bot is not admin in one or more channels." });
      } else if (!isJoined) {
        onSuccess({ is_joined: false, error_message: "⚠️ You haven't joined all channels yet." });
      } else {
        onSuccess({ is_joined: true });
      }
      return;
    }

    let chatId = channels[index];
    isBotAdmin(chatId).then(function(adminOK) {
      if (!adminOK) {
        isAdmin = false;
        index = channels.length; // Exit early
        nextCheck();
        return;
      }

      isUserJoinedChannel(chatId).then(function(joined) {
        if (!joined) {
          isJoined = false;
          index = channels.length; // Exit early
        } else {
          index++;
        }
        nextCheck();
      });
    });
  }

  nextCheck();
}

function scheduleJoinCheck(channels, minutes, onJoined) {
  checkUserInAllChannels(channels,
    function(result) {
      if (result.is_joined) {
        onJoined();
      } else {
        Bot.sendMessage(result.error_message + "\n\n⏳ We'll check again in " + minutes + " minute(s).");
        Bot.run({
          command: "recheck_join_status",
          run_at: Date.now() + minutes * 60 * 1000,
          options: {
            channels: channels,
            minutes: minutes
          }
        });
      }
    },
    function(error) {
      Bot.sendMessage(error.error_message || "Something went wrong checking channel status.");
    }
  );
}

publish({
  checkUserInAllChannels: checkUserInAllChannels,
  scheduleJoinCheck: scheduleJoinCheck
});
