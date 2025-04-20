function isBotAdmin(chatId) {
  const botToken = bot.token;
  const botId = user.telegramid;
  const apiUrl = "https://api.telegram.org/bot" + botToken + "/getChatMember?chat_id=" + chatId + "&user_id=" + botId;
  return HTTP.get(apiUrl, { json: true }).then(function(response) {
    const result = response.result;
    return result && (result.status === "administrator" || result.status === "creator");
  });
}

function isUserJoinedChannel(chatId) {
  const botToken = bot.token;
  const userId = user.telegramid;
  const apiUrl = "https://api.telegram.org/bot" + botToken + "/getChatMember?chat_id=" + chatId + "&user_id=" + userId;
  return HTTP.get(apiUrl, { json: true }).then(function(response) {
    const result = response.result;
    const status = result.status;
    return ["member", "administrator", "creator"].indexOf(status) > -1;
  });
}

function checkUserInAllChannels(channels, onSuccess, onFail) {
  var isAdmin = true;
  var isJoined = true;

  function checkNext(index) {
    if (index >= channels.length) {
      if (!isAdmin) {
        onFail({
          status: false,
          is_joined: false,
          error_message: "❌ The bot is not admin in one or more channels. Please make the bot admin and try again."
        });
      } else if (!isJoined) {
        onSuccess({
          status: true,
          is_joined: false,
          error_message: "⚠️ You have not joined all required channels yet. We'll keep checking every few minutes."
        });
      } else {
        onSuccess({
          status: true,
          is_joined: true
        });
      }
      return;
    }

    const channelId = channels[index];

    isBotAdmin(channelId).then(function(adminStatus) {
      if (!adminStatus) {
        isAdmin = false;
        checkNext(channels.length);
        return;
      }

      isUserJoinedChannel(channelId).then(function(joined) {
        if (!joined) {
          isJoined = false;
          checkNext(channels.length);
          return;
        }

        checkNext(index + 1);
      });
    });
  }

  checkNext(0);
}

function scheduleJoinCheck(channels, minutes, onJoined) {
  checkUserInAllChannels(channels,
    function(result) {
      if (result.is_joined) {
        onJoined();
      } else {
        Bot.sendMessage(result.error_message + "\n\n⏳ Next check in " + minutes + " minute(s)...");
        Bot.run({
          command: "recheck_join_status",
          options: {
            channels: channels,
            minutes: minutes
          },
          run_at: Date.now() + minutes * 60 * 1000
        });
      }
    },
    function(error) {
      Bot.sendMessage("Error: " + error.error_message);
    }
  );
}

publish({
  checkUserInAllChannels: checkUserInAllChannels,
  scheduleJoinCheck: scheduleJoinCheck
});
