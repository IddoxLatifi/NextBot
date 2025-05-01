const { SlashCommandBuilder } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const serverInfoConfig = require("../../config/serverinfo")
const moment = require("moment")
module.exports = {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Displays information about the server"),
  cooldown: 5,
  async execute(interaction, client) {
    const guild = interaction.guild
    await guild.fetch()
    const verificationLevels = {
      0: "None",
      1: "Low",
      2: "Medium",
      3: "High",
      4: "Very high",
    }
    const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : "None"
    const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
    const embed = EmbedBuilder.create({
      title: `Server Information: ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
      color: serverInfoConfig.embed.color,
      footer: serverInfoConfig.embed.footerText.replace("{guildName}", guild.name),
      footerIcon: serverInfoConfig.embed.footerIconUrl,
    })
    if (!serverInfoConfig.embed.showTimestamp) {
      embed.setTimestamp(null)
    }
    embed.addFields(
      { name: "Server ID", value: guild.id, inline: true },
      { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
      { name: "Created on", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
      { name: "Members", value: `${guild.memberCount}`, inline: true },
      { name: "Boosts", value: `${guild.premiumSubscriptionCount || 0} (${boostLevel})`, inline: true },
      { name: "Verification Level", value: verificationLevels[guild.verificationLevel], inline: true },
      { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
      { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
      { name: "Emojis", value: `${guild.emojis.cache.size}`, inline: true },
    )
    if (guild.banner) {
      embed.data.image = { url: guild.bannerURL({ size: 1024 }) }
    }
    const message = await interaction.reply({
      embeds: [embed],
      fetchReply: true,
    })
    setTimeout(() => {
      message.delete().catch((err) => console.error("Error deleting serverinfo message:", err))
    }, 15000) // 15 seconds
  },
}

