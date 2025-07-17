module.exports = {
  name: "guildMemberAdd",
  once: false,
  async execute(member, client) {
    try {
      const inviteTracker = require("../modules/inviteTracker")
      await inviteTracker.trackMemberJoin(member, client)
    } catch (error) {
      console.error("Error in InviteTracker module:", error)
    }
    try {
      const welcomeModule = require("../modules/welcome")
      await welcomeModule.handleMemberJoin(member, client)
    } catch (error) {
      console.error("Error in Welcome module:", error)
    }
    try {
      const presenceConfig = require("../config/presence")
      const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
      if (presenceConfig.welcomeNewMembers) {
        const currentActivity = client.user.presence.activities[0]
        client.user.setPresence({
          activities: [
            {
              name: `Hey ${member.user.username}`,
              type: 0, 
            },
          ],
          status: "online",
        })
        setTimeout(() => {
          const readyEvent = require("./ready")
          if (typeof readyEvent.updatePresence === "function") {
            readyEvent.updatePresence(client)
          } else {
            if (currentActivity) {
              client.user.setPresence({
                activities: [currentActivity],
                status: "online",
              })
            }
          }
        }, presenceConfig.welcomeDuration || 30000) 
      }
    } catch (error) {
      console.error("Error setting welcome presence:", error)
    }
  },
}
