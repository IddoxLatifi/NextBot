const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
class MessageUtils {
  /**
   * @param {Message|Interaction} source 
   * @param {Object} options 
   * @param {string|Object} options.content 
   * @param {boolean} options.ephemeral 
   * @param {number} options.deleteAfter 
   * @returns {Promise<Message>} 
   */
  static async sendTemporaryMessage(source, options = {}) {
    const { content, ephemeral = false, deleteAfter = 15 } = options
    let message
    try {
      if (source.reply) {
        if (source.deferred || source.replied) {
          message = await source.editReply(content)
        } else {
          message = await source.reply({ ...content, ephemeral })
        }
      } else {
        message = await source.reply(content)
      }
      if (!ephemeral && deleteAfter > 0) {
        setTimeout(() => {
          if (message && !message.deleted) {
            message.delete().catch((err) => {
              if (err.code !== 10008) {
                console.error("Error deleting temporary message:", err)
              }
            })
          }
        }, deleteAfter * 1000)
      }
      return message
    } catch (error) {
      console.error("Error sending temporary message:", error)
      return null
    }
  }
  /**
   * @param {Interaction} interaction 
   * @param {Object} options
   * @param {boolean} options.ephemeral
   * @param {boolean} options.isLog 
   * @param {number} options.deleteAfter 
   * @returns {Promise<Message>} 
   */
  static async handleCommandReply(interaction, options = {}) {
    const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
    const { ephemeral = false, isLog = false, deleteAfter = 10 } = options
    if (ephemeral || isLog) {
      return await interaction.reply(options)
    }
    const reply = await interaction.reply(options)
    setTimeout(() => {
      if (interaction.deleteReply) {
        interaction.deleteReply().catch((err) => {
          if (err.code !== 10008) {
            console.error("Error deleting command reply:", err)
          }
        })
      }
    }, deleteAfter * 1000)
    return reply
  }
  /**
   * @param {Function} commandExecute 
   * @param {number} deleteAfter 
   * @returns {Function} 
   */
  static wrapCommandExecute(commandExecute, deleteAfter = 10) {
    return async (interaction, client) => {
      const originalReply = interaction.reply
      interaction.reply = async function (options) {
        if (options.ephemeral || options.isLog) {
          return await originalReply.call(this, options)
        }
        const reply = await originalReply.call(this, options)
        setTimeout(() => {
          if (this.deleteReply) {
            this.deleteReply().catch((err) => {
              if (err.code !== 10008) {
                console.error("Error deleting command reply:", err)
              }
            })
          }
        }, deleteAfter * 1000)
        return reply
      }
      return await commandExecute(interaction, client)
    }
  }
}
module.exports = MessageUtils
