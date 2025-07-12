const { ActivityType } = require("discord.js")
const presenceConfig = require("../config/presence")
module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`)
    updatePresence(client)
    const rotationInterval = Math.max(5000, presenceConfig.rotationInterval || 60000)
    console.log(`Presence rotation interval set to ${rotationInterval}ms`)
    setInterval(() => {
      updatePresence(client)
    }, rotationInterval)
    try {
      const giveawayModule = require("../modules/giveaway")
      if (typeof giveawayModule.loadActiveGiveaways === "function") {
        await giveawayModule.loadActiveGiveaways(client)
        console.log("Loaded active giveaways")
      } else {
        console.log("Warning: loadActiveGiveaways function not found in giveaway module")
      }
    } catch (error) {
      console.error("Error loading giveaways:", error)
    }
    try {
      const afkModule = require("../modules/afk")
      await afkModule.loadAfkUsers(client)
      console.log("Loaded AFK users")
    } catch (error) {
      console.error("Error loading AFK users:", error)
    }
  },
  updatePresence,
}
function updatePresence(client) {
  const _createdBy = "@apt_start_latifi | https://iddox.tech | https://discord.gg/KcuMUUAP5T"
  const presences = presenceConfig.activities
  const randomPresence = presences[Math.floor(Math.random() * presences.length)]
  const activity = {
    name: randomPresence.text,
    type: ActivityType[randomPresence.type],
  }
  if (randomPresence.type === "Streaming" && randomPresence.url) {
    activity.url = randomPresence.url
  }
  client.user.setPresence({
    activities: [activity],
    status: randomPresence.status || "online",
  })
}
