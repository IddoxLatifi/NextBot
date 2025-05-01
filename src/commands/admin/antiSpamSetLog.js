const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("antispamsetlog")
    .setDescription("Sets the log channel for the Anti-Spam system")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The channel where logs should be sent").setRequired(true),
    ),
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: true,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel")
    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({
        embeds: [
          EmbedBuilder.error(
            "Invalid Channel",
            "The selected channel is not a text channel. Please select a text channel.",
          ),
        ],
        ephemeral: true,
      })
    }
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
    antiSpamConfig.logging.channelId = channel.id
    try {
      const configContent = `module.exports = ${JSON.stringify(antiSpamConfig, null, 2)}`
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/antiSpam.js")]
      let additionalMessage = ""
      if (!antiSpamConfig.logging.enabled) {
        antiSpamConfig.logging.enabled = true
        await fs.promises.writeFile(configPath, `module.exports = ${JSON.stringify(antiSpamConfig, null, 2)}`)
        delete require.cache[require.resolve("../../config/antiSpam.js")]
        additionalMessage = " Logging has been automatically activated."
      }
      return interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Log Channel Set",
            `The log channel for the Anti-Spam system has been set to ${channel}.${additionalMessage}`,
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