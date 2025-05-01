module.exports = {
  enabled: false,
  deleteDelay: 0, // 0 for not Delete Info-Message. If you activate, the Bot delete the Info so just let it on zero
  ignoredChannels: [],
  ignoredRoles: [],
  embed: {
    color: "#F04747",
    title: "Ghost ping detected!",
    description: "**{username}** sent a ghost ping.",
    footer: process.env.FOOTER_TEXT ||"",
    footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    showTimestamp: true
  },
  "fields": {
    "originalMessage": {
      enabled: true,
      name: "Original message",
      "value": "```{content}```"// Dont change
    },
    "mentionedUsers": {
      enabled: true,
      name: "Mentioned users",
      "value": "{users}"// Dont change
    },
    "mentionedRoles": {
      enabled: true,
      name: "Roles mentioned",
      "value": "{roles}"// Dont change
    }
  },
  "messages": {
    "noContent": "[No Message]"
  }
}