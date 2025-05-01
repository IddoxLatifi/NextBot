const { SlashCommandBuilder } = require("discord.js")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const EmbedBuilder = require("../../utils/embedBuilder")
module.exports = {
  data: new SlashCommandBuilder().setName("afkend").setDescription("Beendet deinen AFK-Status"),
  cooldown: 10,
  async execute(interaction, client) {
    const afkModule = require("../../modules/afk")
    await afkModule.removeAfkCommand(interaction, client)
  },
}
