const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Activates or deactivates the Welcome system")
    .addBooleanOption((option) =>
      option.setName("activate").setDescription("Whether the Welcome system should be activated").setRequired(true),
    ),
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: true,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const enabled = interaction.options.getBoolean("activate")
    const configPath = path.join(__dirname, "../../config/welcome.js")
    let welcomeConfig
    try {
      delete require.cache[require.resolve("../../config/welcome.js")]
      welcomeConfig = require("../../config/welcome.js")
    } catch (error) {
      console.error("Error loading welcome config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Welcome configuration could not be loaded.")],
        ephemeral: true,
      })
    }
    welcomeConfig.enabled = enabled
    try {
      const configContent = `module.exports = ${JSON.stringify(welcomeConfig, null, 2)}`
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/welcome.js")]
      return interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Welcome System changed",
            `The Welcome system has been ${enabled ? "activated" : "deactivated"}.`,
          ),
        ],
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error saving welcome config:", error)
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The Welcome configuration could not be saved.")],
        ephemeral: true,
      })
    }
  },
}