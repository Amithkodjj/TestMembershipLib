function ensureBotId(callback) {
  let id = Bot.getProperty("my_bot_id");
  if (id) return callback(id);

  Api.getMe({
    on_result: function(res) {
      Bot.setProperty("my_bot_id", res.id, "integer");
      callback(res.id);
    },
    on_error: function() {
      callback(null);
    }
  });
}

function isBotAdminInChannel(channel, callback) {
  Api.getChatMember({
    chat_id: channel,
    user_id: Bot.getProperty("my_bot_id"),
    on_result: function(res) {
      let status = res.status;
      callback(status === "administrator" || status === "creator");
    },
    on_error: function() {
      callback(false);
    }
  });
}

function isBotAdminInAll(channels, done) {
  ensureBotId(function(botId) {
    if (!botId) return done({ ok: false, reason: "Cannot get bot ID" });

    let i = 0;
    function next() {
      if (i >= channels.length) return done({ ok: true });

      isBotAdminInChannel(channels[i], function(isAdmin) {
        if (!isAdmin) return done({ ok: false, reason: "Bot not admin in: " + channels[i] });
        i++;
        next();
      });
    }

    next();
  });
}

function isUserInChannel(channel, userId, callback) {
  Api.getChatMember({
    chat_id: channel,
    user_id: userId,
    on_result: function(res) {
      let status = res.status;
      callback(["member", "administrator", "creator"].includes(status));
    },
    on_error: function() {
      callback(false);
    }
  });
}

function isUserInAll(channels, userId, done) {
  let i = 0;
  function next() {
    if (i >= channels.length) return done({ ok: true });

    isUserInChannel(channels[i], userId, function(joined) {
      if (!joined) return done({ ok: false, notJoinedChannel: channels[i] });
      i++;
      next();
    });
  }

  next();
}

// Public function
function validateMembership(params) {
  let channels = params.channels;
  let userId = params.user_id;
  let onCheck = params.onCheck;

  if (!channels || !userId || !onCheck) {
    return Bot.sendMessage("Missing parameters for membership validation.");
  }

  isBotAdminInAll(channels, function(botCheck) {
    if (!botCheck.ok) {
      return onCheck({
        status: false,
        is_joined: false,
        error_message: botCheck.reason
      });
    }

    isUserInAll(channels, userId, function(userCheck) {
      if (!userCheck.ok) {
        return onCheck({
          status: true,
          is_joined: false,
          error_message: userCheck.notJoinedChannel
        });
      }

      onCheck({
        status: true,
        is_joined: true
      });
    });
  });
}

publish({
  validate: validateMembership
});
