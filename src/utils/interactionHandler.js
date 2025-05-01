const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const handleInteractionReply = async (interaction, options) => {
    const isLogMessage = options.isLog || false
    if (options.ephemeral || isLogMessage) {
      return await interaction.reply(options)
    }
    const reply = await interaction.reply(options)
    setTimeout(() => {
      interaction.deleteReply().catch((err) => {
        console.error("Error deleting interaction reply:", err)
      })
    }, 10000)
    return reply
  }
  module.exports = { handleInteractionReply }
  