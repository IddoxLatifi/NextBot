module.exports = {
  enabled: true,
  title: "Welcome to {guildName}!",
  description:
    "Hey {user}! Please choose your Role in {roles} ✅ {verify} to see all our Channels! 🟣\n\nCheck out our {rules} 📜. We have our own bot that is very sensitive to rule violations!\nHave fun on the Server! 💗",
  embedColor: "#5865F2",
  bannerImage: "https://cdn.discordapp.com/attachments/1234567890/1234567890/banner.png", // Replace with your banner URL
  mentionUser: true,
  showUserInfo: {
    avatarAsImage: false, // Set to false to use thumbnail (right side) position
    createdAt: true,
    joinedAt: true,
    memberCount: true,
    accountAge: false,
    userRoles: true,
    userBanner: false,
  },
  footerText: process.env.FOOTER_TEXT || "{guildName} • Welcome",
  footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "", // Will fall back to guild icon if empty
  defaultRoleId: "", // Single role ID
  defaultRoles: [], // Array of role IDs
  sendDM: false,
  dmMessage:
    "Welcome to our server! Please check out the following channels:\n\n• {verify} to verify your account\n• {rules} for our server rules\n• {roles} to select your roles\n\nIf you have any questions, feel free to ask in {help}!\n\nJoin the server using this invite: {invite}",
  // Server invite settings
  serverInvite: "https://discord.gg/KcuMUUAP5T", // Your static invite URL
  createInviteForDM: false, // Create a permanent invite if no existing invites are found

  // Channel IDs
  channels: {
    rules: "1277003322062143518",
    roles: "1251912376530505758",
    verify: "1149738704768868482",
    help: "1149738928669204613",
  },

  // Pre-defined channel links for DMs with your specific server ID
  // Format: [#channel-name](https://discord.com/channels/SERVER_ID/CHANNEL_ID)
  channelLinks: {
    // Example with your specific server ID (1364290675193024523)
    rules: "[#rules](https://discord.com/channels/1364290675193024523/1277003322062143518)",
    roles: "[#roles](https://discord.com/channels/1364290675193024523/1251912376530505758)",
    verify: "[#verify](https://discord.com/channels/1364290675193024523/1149738704768868482)",
    help: "[#help](https://discord.com/channels/1364290675193024523/1149738928669204613)",
    // Example with the specific link you provided
    ticket: "[#ticket](https://discord.com/channels/1364290675193024523/1364696951081406535)",
  },
  // Channel descriptions in English
  channelDescriptions: {
    rules: "for our server rules",
    roles: "to select your roles",
    verify: "to verify your account",
    help: "for questions and support",
    ticket: "for creating support tickets",
  },
  customFields: [
    // {
    //   name: "Custom Field",
    //   value: "Custom Value",
    //   inline: true
    // }
  ],
  welcomeChannelId: process.env.WELCOME_CHANNEL_ID || "",
}
