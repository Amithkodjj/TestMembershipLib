/*CMD
  command: /start
  help: 
  need_reply: false
  auto_retry_time: 
  folder: 

  <<ANSWER

  ANSWER

  <<KEYBOARD

  KEYBOARD
  aliases: 
  group: 
CMD*/

Libs.membership.validate({
  channels: ["@chbofficial"],
  user_id: user.telegramid,
  onCheck: function(result) {
    if (!result.status) {
      Bot.sendMessage(result.error_message)
    } else if (!result.is_joined) {
      Bot.sendMessage("Please join: " + result.error_message)
    } else {
      Bot.sendMessage("You're all set!")
    }
  }
})

