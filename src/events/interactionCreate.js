const { Events, InteractionType } = require("discord.js")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName)
        if (!command) {
          console.error(`No command matching ${interaction.commandName} was found.`)
          return
        }
        const { cooldowns } = client
        if (!cooldowns.has(command.data.name)) {
          cooldowns.set(command.data.name, new Map())
        }
        const now = Date.now()
        const timestamps = cooldowns.get(command.data.name)
        const cooldownAmount = (command.cooldown || 3) * 1000
        if (timestamps.has(interaction.user.id)) {
          const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount
          if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000)
            return interaction.reply({
              content: `Please wait before using the \`${command.data.name}\` command again. You can use it again <t:${expiredTimestamp}:R>.`,
              ephemeral: true,
            })
          }
        }
        timestamps.set(interaction.user.id, now)
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)
        if (command.permissions) {
          if (command.permissions.adminOnly && interaction.user.id !== process.env.ADMIN_ID) {
            return interaction.reply({
              content: "You don't have permission to use this command.",
              ephemeral: true,
            })
          }
          if (command.permissions.user && command.permissions.user.length > 0) {
            const missingPermissions = command.permissions.user.filter(
              (permission) => !interaction.member.permissions.has(permission),
            )
            if (missingPermissions.length > 0) {
              return interaction.reply({
                content: "You don't have the required permissions to use this command.",
                ephemeral: true,
              })
            }
          }
          if (command.permissions.bot && command.permissions.bot.length > 0) {
            const botMember = await interaction.guild.members.fetchMe()
            const missingPermissions = command.permissions.bot.filter(
              (permission) => !botMember.permissions.has(permission),
            )
            if (missingPermissions.length > 0) {
              return interaction.reply({
                content: "I don't have the required permissions to execute this command.",
                ephemeral: true,
              })
            }
          }
        }
        try {
          await command.execute(interaction, client)
        } catch (error) {
          console.error(`Error executing ${interaction.commandName}`)
          console.error(error)
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: "An error occurred while executing this command.",
              ephemeral: true,
            })
          } else {
            await interaction.reply({
              content: "An error occurred while executing this command.",
              ephemeral: true,
            })
          }
        }
      } else if (interaction.isButton()) {
        console.log(`Button interaction received: ${interaction.customId} from ${interaction.user.tag}`)
        if (interaction.customId === "giveaway_enter" || interaction.customId === "giveaway_claim") {
          const giveawayModule = require("../modules/giveaway")
          await giveawayModule.handleButtonInteraction(interaction, client)
        } else if (
          interaction.customId === "ticket_create" ||
          interaction.customId === "ticket_close" ||
          interaction.customId === "ticket_delete" ||
          interaction.customId === "ticket_claim_giveaway" ||
          interaction.customId.startsWith("ticket_type_")
        ) {
          const ticketModule = require("../modules/ticket")
          await ticketModule.handleButtonInteraction(interaction, client)
        } else if (interaction.customId.startsWith("rolereact_")) {
          try {
            const roleReactModule = require("../modules/rolereact")
            await roleReactModule.handleButtonInteraction(interaction, client)
          } catch (error) {
            console.error("Error processing role reaction button:", error)
            if (!interaction.replied && !interaction.deferred) {
              await interaction
                .reply({
                  content: "An error occurred while processing the role reaction.",
                  ephemeral: true,
                })
                .catch(console.error)
            }
          }
        } else if (
          interaction.customId.startsWith("starboard_rate_") ||
          interaction.customId.startsWith("starboard_comment_") ||
          interaction.customId.startsWith("rating_")
        ) {
          try {
            console.log("Handling starboard button interaction")
            const starboardModule = require("../modules/starboard")
            if (interaction.customId.startsWith("starboard_rate_")) {
              const parts = interaction.customId.split("_")
              const rating = Number.parseInt(parts[2])
              const messageId = parts[3]
              console.log(`Starboard rating: ${rating} for message ${messageId}`)
              if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                interaction.client.tempRatings = interaction.client.tempRatings || new Map()
                interaction.client.tempRatings.set(interaction.user.id, rating)
                await starboardModule.showRatingCommentModal(interaction, rating)
              }
            } else if (interaction.customId.startsWith("starboard_comment_")) {
              const messageId = interaction.customId.split("_")[2]
              await starboardModule.showCommentModal(interaction)
            } else if (interaction.customId.startsWith("rating_")) {
              const parts = interaction.customId.split("_")
              const action = parts[1]
              if (action === "comment") {
                await starboardModule.showCommentModal(interaction)
              } else {
                const rating = Number.parseInt(action)
                if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                  interaction.client.tempRatings = interaction.client.tempRatings || new Map()
                  interaction.client.tempRatings.set(interaction.user.id, rating)
                  await starboardModule.showRatingCommentModal(interaction, rating)
                }
              }
            }
          } catch (error) {
            console.error("Error processing starboard button:", error)
            if (!interaction.replied && !interaction.deferred) {
              await interaction
                .reply({
                  content: "An error occurred while processing the rating.",
                  ephemeral: true,
                })
                .catch(console.error)
            }
          }
        }
      } else if (interaction.type === InteractionType.ModalSubmit) {
        console.log(`Modal submit received: ${interaction.customId} from ${interaction.user.tag}`)
        if (interaction.customId === "ticket_modal_create") {
          const ticketModule = require("../modules/ticket")
          await ticketModule.handleModalSubmit(interaction, client)
        } else if (interaction.customId === "ticket_modal_claim_giveaway") {
          const giveawayModule = require("../modules/giveaway")
          await giveawayModule.handleModalSubmit(interaction, client)
        } else if (interaction.customId.startsWith("rating_modal_")) {
          try {
            const starboardModule = require("../modules/starboard")
            await starboardModule.handleModalSubmit(interaction, client)
          } catch (error) {
            console.error("Error processing rating modal:", error)
            if (!interaction.replied && !interaction.deferred) {
              await interaction
                .reply({
                  content: "An error occurred while processing the rating.",
                  ephemeral: true,
                })
                .catch(console.error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in interactionCreate event:", error)
    }
  },
}
