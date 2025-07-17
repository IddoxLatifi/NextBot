const { SlashCommandBuilder } = require("@discordjs/builders")
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js")
const emojiManager = require("../../modules/emojiManager")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("stealemoji")
    .setDescription("Imports an emoji from another server")
    .setDefaultMemberPermissions(PermissionFlagsBits.MANAGE_EMOJIS_AND_STICKERS)
    .addStringOption((option) =>
      option.setName("emoji").setDescription("The emoji to import (e.g. <:name:id>)").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("name").setDescription("Optional new name for the emoji").setRequired(false),
    ),
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.MANAGE_EMOJIS_AND_STICKERS)) {
        return await interaction.reply({
          content: "❌ You don't have permission to manage emojis.",
          ephemeral: true,
        })
      }
      const emojiString = interaction.options.getString("emoji")
      const customName = interaction.options.getString("name")
      const emojiInfo = emojiManager.parseEmojiString(emojiString)
      if (!emojiInfo || !emojiInfo.isCustom) {
        return await interaction.reply({
          content: "❌ Please provide a valid custom emoji (e.g. <:name:id>).",
          ephemeral: true,
        })
      }
      await interaction.deferReply({ ephemeral: true })
      const importedEmoji = await emojiManager.importEmoji(
        interaction.guild,
        customName || emojiInfo.name,
        emojiInfo.url,
        emojiInfo.isAnimated,
      )
      if (!importedEmoji) {
        return await interaction.editReply({
          content:
            "❌ The emoji could not be imported. The server's emoji limit may have been reached or the emoji is not available.",
          ephemeral: true,
        })
      }
      const embed = new EmbedBuilder()
        .setTitle("✅ Emoji successfully imported")
        .setColor("#00FF00")
        .setDescription(`The emoji was successfully imported as \`:${importedEmoji.name}:\`.`)
        .setThumbnail(importedEmoji.url)
        .setTimestamp()
      await interaction.editReply({
        embeds: [embed],
        ephemeral: true,
      })
    } catch (error) {
      console.error("Error executing stealemoji command:", error)

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ An error occurred while importing the emoji.",
          ephemeral: true,
        })
      } else {
        await interaction.editReply({
          content: "❌ An error occurred while importing the emoji.",
          ephemeral: true,
        })
      }
    }
  },
}
