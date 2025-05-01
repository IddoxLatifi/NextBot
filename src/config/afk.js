module.exports = {
  prefix: "[AFK] ",
  defaultReason: "AFK",
  deleteDelay: 15, // Time in seconds to auto-delete messages. Set to 0 to disable auto-deletion.
  embed: {
    set: {
      color: "#5865f2",
      title: "AFK Status Set",
      description: "You are now marked as AFK: {reason}",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: true,
    },
    remove: {
      color: "#43B581",
      title: "AFK Status Removed",
      description: "Your AFK status has been removed.",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.FOOTER_IMAGE_URL || "",
      showTimestamp: true,
    },
    mention: {
      color: "#FAA61A",
      description: "**{username}** is AFK: {reason} (for {time})",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: true,
    },
  },
  messages: {
    notAfk: "You are not currently marked as AFK.",
    alreadyAfk: "You are already marked as AFK.",
  },
}
