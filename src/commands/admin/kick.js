const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user from the server")
    .addUserOption((option) => option.setName("user").setDescription("The user to kick").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Reason for the kick").setRequired(false)),
  permissions: {
    user: [PermissionFlagsBits.KickMembers],
    bot: [PermissionFlagsBits.KickMembers],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const targetUser = interaction.options.getUser("user")
    const reason = interaction.options.getString("reason") || "No reason provided"
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)
    if (!member) {
      return interaction.reply({
        embeds: [EmbedBuilder.error("Error", "The specified user was not found.")],
        ephemeral: true,
      })
    }
    if (!member.kickable) {
      return interaction.reply({
        embeds: [
          EmbedBuilder.error(
            "Error",
            "I cannot kick this user. They may have a higher role than me.",
          ),
        ],
        ephemeral: true,
      })
    }
    try {
      await member.kick(reason)
      await interaction.reply({
        embeds: [
          EmbedBuilder.success("User Kicked", `**${targetUser.tag}** has been kicked from the server.\nReason: ${reason}`),
        ],
      })
    } catch (error) {
      console.error("Error kicking member:", error)

      await interaction.reply({
        embeds: [EmbedBuilder.error("Error", "An error occurred while kicking the user.")],
        ephemeral: true,
      })
    }
  },
}