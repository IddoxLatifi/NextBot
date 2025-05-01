const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js")
const autoReactModule = require("../../modules/autoReact")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoreact")
    .setDescription("Configure automatic reactions to messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.MANAGE_GUILD)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channel")
        .setDescription("Configure reactions for a specific channel")
        .addChannelOption((option) =>
          option.setName("channel").setDescription("The channel to configure reactions for").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("The emoji to react with").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Configure reactions for a specific user")
        .addUserOption((option) =>
          option.setName("user").setDescription("The user to configure reactions for").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("The emoji to react with").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("keyword")
        .setDescription("Configure reactions for a specific keyword")
        .addStringOption((option) =>
          option.setName("keyword").setDescription("The keyword to react to").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("The emoji to react with").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a reaction configuration")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The type of reaction to remove")
            .setRequired(true)
            .addChoices(
              { name: "Channel", value: "channel" },
              { name: "User", value: "user" },
              { name: "Keyword", value: "keyword" },
            ),
        )
        .addStringOption((option) =>
          option.setName("target").setDescription("The channel/user ID or keyword").setRequired(true),
        )
        .addStringOption((option) => option.setName("emoji").setDescription("The emoji to remove").setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List all configured reactions")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("The type of reactions to list")
            .setRequired(true)
            .addChoices(
              { name: "Channel", value: "channel" },
              { name: "User", value: "user" },
              { name: "Keyword", value: "keyword" },
              { name: "All", value: "all" },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("reload").setDescription("Reload the auto-react configuration from disk"),
    ),
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.MANAGE_GUILD)) {
        return await interaction.reply({
          content: "❌ You don't have permission to use this command.",
          ephemeral: true,
        })
      }
      const subcommand = interaction.options.getSubcommand()
      if (subcommand === "channel") {
        const channel = interaction.options.getChannel("channel")
        const emoji = interaction.options.getString("emoji")
        const success = autoReactModule.addChannelReaction(channel.id, emoji)
        if (success) {
          return await interaction.reply({
            content: `✅ Successfully configured auto-reaction with ${emoji} for channel <#${channel.id}>`,
            ephemeral: true,
          })
        } else {
          return await interaction.reply({
            content: "❌ Failed to configure auto-reaction. Please check the emoji format.",
            ephemeral: true,
          })
        }
      } else if (subcommand === "user") {
        const user = interaction.options.getUser("user")
        const emoji = interaction.options.getString("emoji")
        const success = autoReactModule.addUserReaction(user.id, emoji)
        if (success) {
          return await interaction.reply({
            content: `✅ Successfully configured auto-reaction with ${emoji} for user <@${user.id}>`,
            ephemeral: true,
          })
        } else {
          return await interaction.reply({
            content: "❌ Failed to configure auto-reaction. Please check the emoji format.",
            ephemeral: true,
          })
        }
      } else if (subcommand === "keyword") {
        const keyword = interaction.options.getString("keyword").toLowerCase()
        const emoji = interaction.options.getString("emoji")
        const success = autoReactModule.addKeywordReaction(keyword, emoji)
        if (success) {
          return await interaction.reply({
            content: `✅ Successfully configured auto-reaction with ${emoji} for keyword "${keyword}"`,
            ephemeral: true,
          })
        } else {
          return await interaction.reply({
            content: "❌ Failed to configure auto-reaction. Please check the emoji format.",
            ephemeral: true,
          })
        }
      } else if (subcommand === "remove") {
        const type = interaction.options.getString("type")
        const target = interaction.options.getString("target")
        const emoji = interaction.options.getString("emoji")
        let success = false
        let targetName = target
        if (type === "channel") {
          success = autoReactModule.removeChannelReaction(target, emoji)
          targetName = `<#${target}>`
        } else if (type === "user") {
          success = autoReactModule.removeUserReaction(target, emoji)
          targetName = `<@${target}>`
        } else if (type === "keyword") {
          success = autoReactModule.removeKeywordReaction(target, emoji)
          targetName = `"${target}"`
        }
        if (success) {
          return await interaction.reply({
            content: `✅ Successfully removed auto-reaction ${emoji} for ${type} ${targetName}`,
            ephemeral: true,
          })
        } else {
          return await interaction.reply({
            content: `❌ Failed to remove auto-reaction. Please check if the ${type} has this emoji configured.`,
            ephemeral: true,
          })
        }
      } else if (subcommand === "list") {
        const type = interaction.options.getString("type")
        const config = autoReactModule.getConfig()
        const embed = new EmbedBuilder().setTitle("Auto-React Configurations").setColor("#00AAFF").setTimestamp()
        if (type === "channel" || type === "all") {
          const channelFields = []
          for (const [channelId, emojis] of Object.entries(config.channels)) {
            channelFields.push({
              name: `Channel <#${channelId}>`,
              value: emojis.join(" ") || "No emojis configured",
              inline: false,
            })
          }
          if (channelFields.length > 0) {
            embed.addFields(channelFields)
          } else if (type === "channel") {
            embed.setDescription("No channel reactions configured")
          }
        }
        if (type === "user" || type === "all") {
          const userFields = []
          for (const [userId, emojis] of Object.entries(config.users)) {
            userFields.push({
              name: `User <@${userId}>`,
              value: emojis.join(" ") || "No emojis configured",
              inline: false,
            })
          }
          if (userFields.length > 0) {
            embed.addFields(userFields)
          } else if (type === "user") {
            embed.setDescription("No user reactions configured")
          }
        }
        if (type === "keyword" || type === "all") {
          const keywordFields = []
          for (const [keyword, emojis] of Object.entries(config.keywords)) {
            keywordFields.push({
              name: `Keyword "${keyword}"`,
              value: emojis.join(" ") || "No emojis configured",
              inline: false,
            })
          }
          if (keywordFields.length > 0) {
            embed.addFields(keywordFields)
          } else if (type === "keyword") {
            embed.setDescription("No keyword reactions configured")
          }
        }
        if (
          type === "all" &&
          Object.keys(config.channels).length === 0 &&
          Object.keys(config.users).length === 0 &&
          Object.keys(config.keywords).length === 0
        ) {
          embed.setDescription("No auto-reactions configured")
        }
        return await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        })
      } else if (subcommand === "reload") {
        autoReactModule.reloadConfig()
        return await interaction.reply({
          content: "✅ Auto-react configuration reloaded successfully.",
          ephemeral: true,
        })
      }
    } catch (error) {
      console.error("Error executing autoreact command:", error)
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({
          content: "❌ An error occurred while executing this command.",
          ephemeral: true,
        })
      }
    }
  },
}
