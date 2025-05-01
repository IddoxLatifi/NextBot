const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Deletes a specific number of messages")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (1-100)")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((option) =>
      option.setName("user").setDescription("Only delete messages from this user").setRequired(false),
    ),
  permissions: {
    user: [PermissionFlagsBits.ManageMessages],
    bot: [PermissionFlagsBits.ManageMessages],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const amount = interaction.options.getInteger("amount")
    const targetUser = interaction.options.getUser("user")
    await interaction.deferReply({ ephemeral: true })
    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 })
      let filteredMessages = messages
      if (targetUser) {
        filteredMessages = messages.filter((msg) => msg.author.id === targetUser.id)
      }
      const messagesToDelete = filteredMessages.first(amount)
      if (messagesToDelete.length === 0) {
        return interaction.editReply({
          embeds: [
            EmbedBuilder.warning(
              "No Messages",
              "No messages were found that could be deleted.",
            ),
          ],
        })
      }
      const deleted = await interaction.channel.bulkDelete(messagesToDelete, true)
      await interaction.editReply({
        embeds: [
          EmbedBuilder.success("Messages Deleted", `${deleted.size} messages were successfully deleted.`),
        ],
      })
    } catch (error) {
      console.error("Error purging messages:", error)
      await interaction.editReply({
        embeds: [
          EmbedBuilder.error(
            "Error",
            "An error occurred while deleting the messages. Messages older than 14 days cannot be deleted.",
          ),
        ],
      })
    }
  },
}