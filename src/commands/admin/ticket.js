const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const fs = require("fs")
const path = require("path")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket System Commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("send")
        .setDescription("Sends the ticket panel to a channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel where the ticket panel should be sent")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Sets the log channel for the ticket system")
        .addChannelOption((option) =>
          option
            .setName("logchannel")
            .setDescription("The channel where ticket logs should be sent")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("activate")
        .setDescription("Activates or deactivates ticket logging")
        .addBooleanOption((option) =>
          option.setName("log").setDescription("Whether ticket logging should be activated").setRequired(true),
        ),
    ),
  permissions: {
    user: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageGuild],
    bot: [PermissionFlagsBits.ManageChannels],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand()
    const ticketModule = require("../../modules/ticket")
    if (subcommand === "send") {
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
      try {
        await ticketModule.createTicketPanel(interaction, client)
      } catch (error) {
        console.error("Error sending ticket panel:", error)
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "An error occurred while sending the ticket panel.")],
          ephemeral: true,
        })
      }
    } else if (subcommand === "set") {
      const logChannel = interaction.options.getChannel("logchannel")
      if (logChannel.type !== ChannelType.GuildText) {
        return interaction.reply({
          embeds: [
            EmbedBuilder.error(
              "Invalid Channel",
              `The selected channel ${logChannel.name} is not a text channel. Please select a text channel.`,
            ),
          ],
          ephemeral: true,
        })
      }
      const configPath = path.join(__dirname, "../../config/ticketsystem.js")
      let ticketConfig
      try {
        delete require.cache[require.resolve("../../config/ticketsystem.js")]
        ticketConfig = require("../../config/ticketsystem.js")
      } catch (error) {
        console.error("Error loading ticket config:", error)
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "The ticket configuration could not be loaded.")],
          ephemeral: true,
        })
      }
      ticketConfig.logChannelId = logChannel.id
      process.env.TICKET_LOG_CHANNEL_ID = logChannel.id
      const configContent = `module.exports = ${JSON.stringify(ticketConfig, null, 2)}`
      const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
      try {
        await fs.promises.writeFile(configPath, configContent)
        delete require.cache[require.resolve("../../config/ticketsystem.js")]
        return interaction.reply({
          embeds: [
            EmbedBuilder.success(
              "Log Channel Set",
              `The log channel for the ticket system has been set to <#${logChannel.id}>.
Please also update your .env file with:
\`\`\`
TICKET_LOG_CHANNEL_ID=${logChannel.id}
\`\`\``,
            ),
          ],
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error saving ticket config:", error)
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "The ticket configuration could not be saved.")],
          ephemeral: true,
        })
      }
    } else if (subcommand === "activate") {
      const enableLogs = interaction.options.getBoolean("log")
      const configPath = path.join(__dirname, "../../config/ticketsystem.js")
      let ticketConfig
      try {
        delete require.cache[require.resolve("../../config/ticketsystem.js")]
        ticketConfig = require("../../config/ticketsystem.js")
      } catch (error) {
        console.error("Error loading ticket config:", error)
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "The ticket configuration could not be loaded.")],
          ephemeral: true,
        })
      }
      if (enableLogs && !ticketConfig.logChannelId) {
        return interaction.reply({
          embeds: [
            EmbedBuilder.warning(
              "No Log Channel",
              "Logging has been activated, but no log channel is configured. Please set a log channel with `/ticket set logchannel`.",
            ),
          ],
          ephemeral: true,
        })
      }
      ticketConfig.enableLogs = enableLogs
      const configContent = `module.exports = ${JSON.stringify(ticketConfig, null, 2)}`
      try {
        await fs.promises.writeFile(configPath, configContent)
        delete require.cache[require.resolve("../../config/ticketsystem.js")]
        return interaction.reply({
          embeds: [
            EmbedBuilder.success(
              "Ticket Logging Changed",
              `Logging for the ticket system has been ${enableLogs ? "activated" : "deactivated"}.`,
            ),
          ],
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error saving ticket config:", error)
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "The ticket configuration could not be saved.")],
          ephemeral: true,
        })
      }
    }
  },
}