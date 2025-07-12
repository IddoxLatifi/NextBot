module.exports = {
  embedColor: "#5865F2",
  panelTitle: "Support-Tickets",
  panelDescription: "Click the button below to create a support ticket or claim a prize.",
  createButtonLabel: "Create Ticket",
  modalTitle: "Create Ticket",
  deleteDelay: 5,
  enableLogs: true,
  logChannelId: "",
  enableDMNotification: true,
  "dmNotification": {
    enabled: true,
    message: "Thanks for contacting us. If you got some Suggestions or other questions, please open a new Ticket.",
    ratingEnabled: true,
    ratingMessage: "Please rate our Server at: {ratingLink} Thank you ❤",
    ratingLink: "https://discord.com/channels/1149686585894379560/1366463254259568721",
    "embed": {
      color: "#71368A",
      title: "Ticket Closed",
      footer: process.env.FOOTER_TEXT || "",
      footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
      showTimestamp: false
    }
  },
  "transcript": {
    enabled: true,
    includeEmbeds: true,
    includeAttachments: true,
    maxMessages: 100,
    fileName: "LatifiMods-transcript-{ticketId}.txt",
    header: "=== TICKET TRANSCRIPT ===\n",
    footer: "\n=== END OF TRANSCRIPT ==="
  },
  "embed": {
    "panel": {
      color: "#5865F2",
      title: "Support-Tickets",
      description: "Click the button below to create a support ticket or claim a prize.",
      "footer": process.env.FOOTER_TEXT || "",
      "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || "",
      "showTimestamp": false
    },
    "ticket": {
      color: "#5865F2",
      "footer": process.env.FOOTER_TEXT ||"",
      "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || "", 
      "showTimestamp": false
    },
    "close": {
      color: "#F04747",
      title: "Ticket closed",
      "footer": process.env.FOOTER_TEXT || "",
      "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || "",
      "showTimestamp": false
    },
    "giveaway": {
      color: "#43B581",
      title: "Claim Giveaway",
      "footer": process.env.FOOTER_TEXT ||"",
      "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || "",
      "showTimestamp": false
    },
    "log": {
      color: "#5865F2",
      "footer": process.env.FOOTER_TEXT || "",
      "footerIconUrl": process.env.EMBED_FOOTER_IMAGE_URL || ""
    }
  },
  giveawayClaimButtonLabel: "Claim Giveaway",
  giveawayClaimButtonEmoji: "🎁",
  "messages": {
    ticketCreated: "Your ticket was created: {channel}",
    ticketClosed: "This ticket was closed by {user}.",
    ticketDeleted: "This ticket will be deleted in {seconds} seconds...",
    giveawayClaimDescription: "Click the button below to create a ticket and claim your prize."
  },
  "permissions": {
    "supportRoleIds": []
  }
}