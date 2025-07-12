module.exports = {
  "enabled": true,
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
    "footer": process.env.FOOTER_TEXT || "",
    "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || "",
    "showTimestamp": true
  },
  "inviteRegex": "(?:https?:\\/\\/)?(?:www\\.)?(?:discord\\.(?:gg|io|me|li|com\\/invite))\\/([a-zA-Z0-9-_]+)",
  "logging": {
    "enabled": true,
    "channelId": "1260964764939583549"
  },
  "punishment": {
    "enabled": true,
    "type": "mute",
    "muteDuration": 10,
    "reason": "Sending Discord invitation links"
  }
}