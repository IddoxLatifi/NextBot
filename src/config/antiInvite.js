module.exports = {
  "enabled": false,
  "deleteMessage": true,
  "sendWarning": true,
  "deleteWarningDelay": 5,
  "exemptChannels": [],
  "exemptRoles": [],
  "exemptUsers": [],
  "embed": {
    "color": "#F04747",
    "title": "Invitation link recognized!",
    "description": "**{username}**, sending Discord invitation links is not allowed.",
    "footer": "Created by @apt_start_latifi • 👾os.nextbot.store👾",
    "footerIconUrl": "https://cdn.discordapp.com/attachments/1251990988835258439/1280208484004139068/LM_Pfp_Nitro.gif?ex=6811038f&is=680fb20f&hm=8e3f9ea151129caac9d7bd2abc48afbb9f26d0af00324a16fb9a0ff8f8ac1474&",
    "showTimestamp": true
  },
  "inviteRegex": "(?:https?:\\/\\/)?(?:www\\.)?(?:discord\\.(?:gg|io|me|li|com\\/invite))\\/([a-zA-Z0-9-_]+)",
  "logging": {
    "enabled": true,
    "channelId": ""
  },
  "punishment": {
    "enabled": true,
    "type": "mute",
    "muteDuration": 10,
    "reason": "Sending Discord invitation links"
  }
}