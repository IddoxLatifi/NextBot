module.exports = {
  name: "messageDelete",
  once: false,
  async execute(message, client) {
    if (message.author?.bot) return
    try {
      const antiGhostPingModule = require("../modules/antiGhostPing")
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      await antiGhostPingModule.handleMessageDelete(message, client)
    } catch (error) {
      console.error("Error in AntiGhostPing module:", error)
    }
  },
}
