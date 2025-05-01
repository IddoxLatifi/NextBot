const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ratingset")
    .setDescription("Sets the channel for the rating module")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where the rating module should be displayed")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: {
    adminOnly: true,
  },
  async execute(interaction, client) {
    try {
      const channel = interaction.options.getChannel("channel")
      const configPath = path.join(__dirname, "../../config/starboard.js")
      let configContent = fs.readFileSync(configPath, "utf8")
      configContent = configContent.replace(/channelId:\s*["'](.*)["']/, `channelId: "${channel.id}"`)
      configContent = configContent.replace(/ratingChannelId:\s*["'](.*)["']/, `ratingChannelId: "${channel.id}"`)
      fs.writeFileSync(configPath, configContent)
      const starboardConfig = require("../../config/starboard")
      starboardConfig.channelId = channel.id
      starboardConfig.ratingChannelId = channel.id
      const starboardModule = require("../../modules/starboard")
      await starboardModule.createRatingEmbed(client)
      await interaction.reply({
        content: `✅ Rating channel has been successfully set to <#${channel.id}>!`,
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error in ratingset command:", error)
      await interaction.reply({
        content: "❌ An error occurred while setting the rating channel.",
        ephemeral: true,
      })
    }
  },
}
