module.exports = {
  embedColor: "#5865F2",
  panelTitle: "Support-Tickets",
  panelDescription:
    "Click the button below to create a support ticket or claim a prize.",
  createButtonLabel: "Create Ticket",
  modalTitle: "Create Ticket",
  deleteDelay: 5, // Seconds
  enableLogs: false,
  logChannelId: "",
  embed: {
    panel: {
      color: "#5865F2",
      title: "Support-Tickets",
      description: "Click the button below to create a support ticket or claim a prize.",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false,
    },
    ticket: {
      color: "#5865F2",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false,
    },
    close: {
      color: "#F04747",
      title: "Ticket closed",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false,
    },
    giveaway: {
      color: "#43B581",
      title: "Claim Giveaway",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false,
    },
    log: {
      color: "#5865F2",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    },
  },
  giveawayClaimButtonLabel: "Claim Giveaway",
  giveawayClaimButtonEmoji: "🎁",
  messages: {
    ticketCreated: "Your ticket was created: {channel}",
    ticketClosed: "This ticket was closed by {user}.",
    ticketDeleted: "This ticket will be deleted in {seconds} seconds...",
    giveawayClaimDescription:
      "Click the button below to create a ticket and claim your prize.",
  },
  permissions: {
    supportRoleIds: [], // Role IDs, not user IDs! These roles can edit tickets
  },
}
