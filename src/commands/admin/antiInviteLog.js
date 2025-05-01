const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("antiinvitelog")
    .setDescription("Activates or deactivates logging for the Anti-Invite system")
    .addBooleanOption((option) =>
      option.setName("activate").setDescription("Whether logging should be activated").setRequired(true),
    ),
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: true,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const enabled = interaction.options.getBoolean("activate")
    const configPath = path.join(__dirname, "../../config/antiInvite.js")
    let antiInviteConfig
    try {
      delete require.cache[require.resolve("../../config/antiInvite.js")]
      antiInviteConfig = require("../../config/antiInvite.js")
    } catch (error) {
      console.error("Error loading anti-invite config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Anti-Invite configuration could not be loaded.")],
        ephemeral: true,
      })
    }
    if (!antiInviteConfig.logging) {
      antiInviteConfig.logging = {
        enabled: false,
        channelId: "",
      }
    }
    antiInviteConfig.logging.enabled = enabled
    if (enabled && !antiInviteConfig.logging.channelId) {
      return interaction.reply({
        embeds: [
          EmbedBuilder.warning(
            "No Log Channel",
            "Logging has been activated, but no log channel is configured. Please set a log channel with `/antiinvitesetlog`.",
          ),
        ],
        ephemeral: true,
      })
    }
    try {
      const configContent = `module.exports = ${JSON.stringify(antiInviteConfig, null, 2)}`
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/antiInvite.js")]
      const reply = await interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Anti-Invite Logging changed",
            `Logging for the Anti-Invite system has been ${enabled ? "activated" : "deactivated"}.`,
          ),
        ],
        ephemeral: true,
      })
      return
    } catch (error) {
      console.error("Error saving anti-invite config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Anti-Invite configuration could not be saved.")],
        ephemeral: true,
      })
    }
  },
}