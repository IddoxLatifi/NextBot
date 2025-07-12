module.exports = {
  embedColor: "#71368A",
  defaultImage:
    "",
  defaultDuration: "24h", // Default duration if not set: 24 hours
  defaultWinners: 1, // Default number of winners if not set: 1
  winnerTicketChannelId: "", // Set up the ticket module first with "/ticket send channel:" and set the channel ID here. Otherwise, the giveaway module won't work.
  claimPeriod: 1420, // Minutes that winners have to claim their prize before automatic reroll. 0 = disabled
  embed: {
    footer: process.env.FOOTER_TEXT || "",
    footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    showTimestamp: true,
  },
  messages: {
    giveaway: "🎉 **GIVEAWAY** 🎉",
    giveawayEnded: "🎉 **GIVEAWAY ENDED** 🎉",
    noWinner: "Giveaway canceled, no valid participants.",
    winners: "Winners:",
    endedAt: "Ended",
    hostedBy: "Hosted by:",
  },
  // Increased win chances for specific users or roles
  boostedChances: {
    enabled: true, // Set to true to enable this feature
    users: {
      // User ID: Percentage (100 = guaranteed win)
      // "987654321098765432": 100, // Example: User with 50% increased win chance
      // "987654321098765432": 100 // Example: User with guaranteed win
    },
    roles: {
      // Role ID: Percentage
      // "123456789012345678": 20, // Example: Role with 20% increased win chance
      // "987654321098765432": 30 // Example: Role with 30% increased win chance
    },
  },
}
