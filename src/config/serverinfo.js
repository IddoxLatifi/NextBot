module.exports = {
    embed: {
      color: "#5865F2", // Discord blue color
      footerText: process.env.FOOTER_TEXT || "", // {guildName} will be replaced with the actual guild name
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false, 
    },
  }
  