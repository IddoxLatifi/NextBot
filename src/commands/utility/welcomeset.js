const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcomeset")
    .setDescription("Sets the channel for welcome messages")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel where welcome messages will be sent").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  permissions: {
    adminOnly: true,
  },
  async execute(interaction, client) {
    try {
      const channel = interaction.options.getChannel("channel")
      process.env.WELCOME_CHANNEL_ID = channel.id
      const configPath = path.join(__dirname, "../../config/welcome.js")
      try {
        let configContent = fs.readFileSync(configPath, "utf8")
        configContent = configContent.replace(/welcomeChannelId:\s*["'](.*)["']/, `welcomeChannelId: "${channel.id}"`)
        fs.writeFileSync(configPath, configContent)
        delete require.cache[require.resolve("../../config/welcome.js")]
        await interaction.reply({
          content: `✅ Welcome channel has been successfully set to <#${channel.id}>!`,
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error updating welcome config:", error)
        await interaction.reply({
          content: "❌ An error occurred while setting the welcome channel.",
          ephemeral: true,
        })
      }
    } catch (error) {
      console.error("Error in welcomeset command:", error)
      await interaction.reply({
        content: "❌ An error occurred while setting the welcome channel.",
        ephemeral: true,
      })
    }
  },
}
