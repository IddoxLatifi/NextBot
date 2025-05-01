const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const path = require("path")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ghostping")
    .setDescription("Activates or deactivates the Ghost-Ping system")
    .addBooleanOption((option) =>
      option.setName("activate").setDescription("Whether the Ghost-Ping system should be activated").setRequired(true),
    ),
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: true,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const enabled = interaction.options.getBoolean("activate")
    const configPath = path.join(__dirname, "../../config/ghostping.js")
    let ghostPingConfig
    try {
      delete require.cache[require.resolve("../../config/ghostping.js")]
      ghostPingConfig = require("../../config/ghostping.js")
    } catch (error) {
      console.error("Error loading ghost ping config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Ghost-Ping configuration could not be loaded.")],
        ephemeral: true,
      })
    }
    ghostPingConfig.enabled = enabled
    try {
      const configContent = `module.exports = ${JSON.stringify(ghostPingConfig, null, 2)}`
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/ghostping.js")]
      return interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Ghost-Ping System changed",
            `The Ghost-Ping system has been ${enabled ? "activated" : "deactivated"}.`,
          ),
        ],
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error saving ghost ping config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Ghost-Ping configuration could not be saved.")],
        ephemeral: true,
      })
    }
  },
}