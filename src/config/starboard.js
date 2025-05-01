module.exports = {
  channelId: "1364290703101788321", 
  ratingChannelId: "1364290703101788321",
  embed: {
    title: "Rate our server!",
    description:
      "We'd love for you to leave us a review. Click on one of the stars below to rate us and feel free to leave a comment!",
    color: "#FFD700", // Gold color
    footer: process.env.FOOTER_TEXT ||"",
    footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    thumbnailUrl: "https://cdn.discordapp.com/attachments/1251990988835258439/1280208484004139068/LM_Pfp_Nitro.gif?ex=6809c34f&is=680871cf&hm=749b9a5abf304352f564233f82e33bd9657473eef1267473c049a92bd8662497&", // Optional: URL to thumbnail image
    showTimestamp: false, 
  },
  enableRating: false,
  ratingEmojis: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"],
  allowComments: false,//Keep false, i fix it soon
  allowMultipleRatings: true,
  // Cooldown between ratings in seconds (e.g., 3600 = 1 hour, 86400 = 1 day)
  // Set to 0 to disable cooldown
  ratingCooldown: 0,
  stickyEmbed: true,
}
