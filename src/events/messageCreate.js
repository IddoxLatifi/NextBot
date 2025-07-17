module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message, client) {
    // Handle user messages (non-bot)
    if (!message.author.bot) {
      try {
        const afkModule = require("../modules/afk")
        await afkModule.handleMessage(message, client)
      } catch (error) {
        console.error("Error in AFK module:", error)
      }
      try {
        const autoReactModule = require("../modules/autoReact")
        await autoReactModule.handleMessage(message, client)
      } catch (error) {
        console.error("Error in AutoReact module:", error)
      }
      try {
        const starboardModule = require("../modules/starboard")
        await starboardModule.handleMessage(message, client)
      } catch (error) {
        console.error("Error in Starboard module:", error)
      }
      try {
        const antiGhostPingModule = require("../modules/antiGhostPing")
        await antiGhostPingModule.handleMessageCreate(message, client)
      } catch (error) {
        console.error("Error in AntiGhostPing module:", error)
      }
      try {
        const antiInviteModule = require("../modules/antiInvite")
        const isInvite = await antiInviteModule.handleMessage(message, client)
        if (isInvite) return
      } catch (error) {
        console.error("Error in AntiInvite module:", error)
      }
      try {
        const antiSpamModule = require("../modules/antiSpam")
        const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
        const isSpam = await antiSpamModule.handleMessage(message, client)
        if (isSpam) return
      } catch (error) {
        console.error("Error in AntiSpam module:", error)
      }
      try {
        const stickymessageModule = require("../modules/stickymessage")
        await stickymessageModule.handleMessage(message, client)
      } catch (error) {
        console.error("Error in StickyMessage module:", error)
      }
    }
    
    // Handle bot messages (for auto-react and sticky message)
    if (message.author.bot) {
      try {
        const autoReactModule = require("../modules/autoReact")
        await autoReactModule.handleMessage(message, client, true)
      } catch (error) {
        console.error("Error in AutoReact module for bot message:", error)
      }
    }
  },
}
