const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("antiinvitesetlog")
    .setDescription("Sets the log channel for the Anti-Invite system")
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
    antiInviteConfig.logging.channelId = channel.id
    try {
      const configContent = `module.exports = ${JSON.stringify(antiInviteConfig, null, 2)}`
      await fs.promises.writeFile(configPath, configContent)
      delete require.cache[require.resolve("../../config/antiInvite.js")]
      let additionalMessage = ""
      if (!antiInviteConfig.logging.enabled) {
        antiInviteConfig.logging.enabled = true
        await fs.promises.writeFile(configPath, `module.exports = ${JSON.stringify(antiInviteConfig, null, 2)}`)
        delete require.cache[require.resolve("../../config/antiInvite.js")]
        additionalMessage = " Logging has been automatically activated."
      }
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      const reply = await interaction.reply({
        embeds: [
          EmbedBuilder.success(
            "Log Channel Set",
            `The log channel for the Anti-Invite system has been set to ${channel}.${additionalMessage}`,
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