module.exports = {
    embedColors: {
      join: "#4CAF50",
      leave: "#F44336",
      info: "#3498db",
    },
    embedTitles: {
      join: "🎉 A member has joined the server",
      leave: "🚪 A member has left the server",
      info: "📝 Invite Information",
    },
    embed: {
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: true,
    },
    messages: {
      unknownInvite: "Unknown",
      unknownInviter: "Unknown",
      normalInvite: "Normal Invite",
    },
    // Cache settings donot change
    cacheRefreshInterval: 60 * 60 * 1000, // 1 hour in milliseconds
  }
  
