module.exports = {
  enabled: true,
  title: "Welcome to LatifiMods!",
  description:
    "Hey {user}! Please choose your Role in {verify} to see all our Channels! 🟣\n\nCheck out our {rules} 📜. We have our own bot that is very sensitive to rule violations!\n If you have any questions, feel free to ask in {help}!\n Have fun on the Server! 💗",
  embedColor: "#5865F2",
  bannerImage: "https://cdn.discordapp.com/attachments/1251990988835258439/1280208483517595701/LM_Banner_Nitro.gif?ex=68792a0f&is=6877d88f&hm=dbaf05891887264d43d9752247201f9b34737598980b484bbe90386a3b7e9434&", // Replace with your banner URL
  mentionUser: false,
  
  // Rate limiting settings
  rateLimit: {
    enabled: true,
    cooldownTime: 30000, // 30 seconds in milliseconds
    cleanupInterval: 300000, // 5 minutes in milliseconds
  },
  
  showUserInfo: {
    avatarAsImage: false, // Set to false to use thumbnail (right side) position
    createdAt: true,
    joinedAt: true,
    memberCount: false,
    accountAge: true,
    userRoles: false,
    userBanner: false,
  },
  footerText: process.env.FOOTER_TEXT || "",
  footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "", 
  defaultRoleId: "", // Single role ID
  defaultRoles: [], // Array of role IDs
  sendDM: false,
  dmMessage:
    "Welcome to our server! Please check out the following channels:\n\n• {verify} to verify your account\n• {rules} for our server rules\n• {help} for any questions\n\nIf you have any questions, feel free to ask in {help}!\n\nJoin the server using this invite: {invite} \n\n Join our Tutorial Discord : https://discord.gg/9bmVssTMQA",
  // Server invite settings
  serverInvite: "https://discord.gg/KcuMUUAP5T", // Your static invite URL
  createInviteForDM: false, // Create a permanent invite if no existing invites are found

  // Channel IDs required
  channels: {
    rules: "",
    verify: "",
    help: "",
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
