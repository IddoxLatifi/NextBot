module.exports = {
  enabled: true,
  channelId: "", // Wird vom /livestats Command gesetzt
  updateInterval: 180000, // 3 Minuten in ms
  embed: {
    color: "#6f42c1", // Dunkellila
    title: "📊 Server Livestats",
    description: "Here you can see the current statistics of the server!",
    footerText: "Created by @apt_start_latifi | iddox.tech 👾",
    footerIconUrl: process.env.EMBED_FOOTER_IMAGE_URL || "",
    showTimestamp: true,
    fields: [
      {
        name: "👥 Members",
        key: "members",
        inline: true,
        enabled: true,
      },
      {
        name: "🤖 Bots",
        key: "bots",
        inline: true,
        enabled: true,
      },
      {
        name: "🚀 Boosts",
        key: "boosts",
        inline: true,
        enabled: true,
      },
      {
        name: "🏆 Boost Level",
        key: "boostlevel",
        inline: true,
        enabled: true,
      },
      {
        name: "💬 Channels",
        key: "channels",
        inline: true,
        enabled: true,
      },
      {
        name: "#️⃣ Text-Channels",
        key: "textchannels",
        inline: true,
        enabled: true,
      },
      {
        name: "🔊 Voice-Channels",
        key: "voicechannels",
        inline: true,
        enabled: true,
      },
      {
        name: "🏷️ Roles",
        key: "roles",
        inline: true,
        enabled: true,
      },
      {
        name: "📅 Created",
        key: "created",
        inline: true,
        enabled: true,
      },
      {
        name: "👑 Owner",
        key: "owner",
        inline: true,
        enabled: true,
      },
      {
        name: "🖼️ Banner",
        key: "banner",
        inline: false,
        enabled: true,
      },
      {
        name: "😃 Emojis",
        key: "emojis",
        inline: false,
        enabled: true,
      },
      {
        name: "⏰ Time",
        key: "time",
        inline: false,
        enabled: true,
      },
    ],
  },
  hammertimeFormat: "<t:{timestamp}:T>", // Discord Hammertime für Uhrzeit
} 