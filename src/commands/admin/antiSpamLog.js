const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const path = require("path")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  data: new SlashCommandBuilder()
    .setName("antispamlog")
    .setDescription("Activates or deactivates logging for the Anti-Spam system")
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
    const configPath = path.join(__dirname, "../../config/antiSpam.js")
    let antiSpamConfig
    try {
      delete require.cache[require.resolve("../../config/antiSpam.js")]
      antiSpamConfig = require("../../config/antiSpam.js")
    } catch (error) {
      console.error("Error loading anti-spam config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Anti-Spam configuration could not be loaded.")],
        ephemeral: true,
      })
    }
    if (!antiSpamConfig.logging) {
      antiSpamConfig.logging = {
        enabled: false,
        channelId: "",
      }
    }
    antiSpamConfig.logging.enabled = enabled
    if (enabled && !antiSpamConfig.logging.channelId) {
      return interaction.reply({
        embeds: [
          EmbedBuilder.warning(
            "No Log Channel",
            "Logging has been activated, but no log channel is configured. Please set a log channel with `/antispamsetlog`.",
          ),
        ],
        ephemeral: true,
      })
    }
    try {
      const configContent = `module.exports = ${JSON.stringify(antiSpamConfig, null, 2)}`
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/antiSpam.js")]
      return interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Anti-Spam Logging changed",
            `Logging for the Anti-Spam system has been ${enabled ? "activated" : "deactivated"}.`,
          ),
        ],
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error saving anti-spam config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Anti-Spam configuration could not be saved.")],
        ephemeral: true,
      })
    }
  },
}