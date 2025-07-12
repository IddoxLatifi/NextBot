module.exports = {
  channelId: "", 
  ratingChannelId: "",
  embed: {
    title: "Rate our server!",
    description:
      "We'd love for you to leave us a review. Click on one of the stars below to rate us and feel free to leave a comment!",
    color: "#FFD700", // Gold color
    footer: process.env.FOOTER_TEXT ||"",
    footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    thumbnailUrl: "", // Optional: URL to thumbnail image
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
