const { SlashCommandBuilder } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
module.exports = {
  data: new SlashCommandBuilder()
    .setName("afkset")
    .setDescription("Setzt deinen AFK-Status")
    .addStringOption((option) =>
      option.setName("grund").setDescription("Grund für deinen AFK-Status").setRequired(false),
    ),
  cooldown: 10,
  async execute(interaction, client) {
    const reason = interaction.options.getString("grund") || null
    const afkModule = require("../../modules/afk")
    await afkModule.setAfk(interaction, client, reason)
  },
}
