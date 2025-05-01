const { Events } = require("discord.js")
module.exports = {
  name: Events.MessageReactionAdd,
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return
    if (reaction.partial) {
      try {
        await reaction.fetch()
      } catch (error) {
        console.error("Error fetching reaction:", error)
        return
      }
    }
    console.log(`Reaction added: ${reaction.emoji.name} by ${user.tag} to message ${reaction.message.id}`)
  },
}
