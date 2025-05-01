const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user from the server")
    .addUserOption((option) => option.setName("user").setDescription("The user to ban").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the ban").setRequired(false))
    .addIntegerOption((option) =>
      option
        .setName("days")
        .setDescription("Number of days of messages to delete (0-7)")
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false),
    ),
  permissions: {
    user: [PermissionFlagsBits.BanMembers],
    bot: [PermissionFlagsBits.BanMembers],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const targetUser = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "No reason provided"
    const days = interaction.options.getInteger("days") || 0
    const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [
          EmbedBuilder.error(
            "Error",
            "I cannot ban this user. They may have a higher role than me.",
          ),
        ],
        ephemeral: true,
      })
    }
    try {
      await interaction.guild.members.ban(targetUser, {
        deleteMessageDays: days,
        reason: reason,
      })
      await interaction.reply({
        embeds: [
          EmbedBuilder.success("User Banned", `**${targetUser.tag}** has been banned from the server.\nReason: ${reason}`),
        ],
      })
    } catch (error) {
      console.error("Error banning user:", error)
      await interaction.reply({
        embeds: [EmbedBuilder.error("Error", "An error occurred while banning the user.")],
        ephemeral: true,
      })
    }
  },
}