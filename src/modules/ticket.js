const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
} = require("discord.js")
const ticketConfig = require("../config/ticketsystem")
const fs = require("fs")
const path = require("path")
const MessageUtils = require("../utils/messageUtils")
const DATA_DIR = path.join(__dirname, "../../data")
const TICKETS_DIR = path.join(DATA_DIR, "tickets")
const USER_TICKETS_DIR = path.join(DATA_DIR, "user-tickets")
const TRANSCRIPTS_DIR = path.join(DATA_DIR, "transcripts")
function ensureDirectoriesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(TICKETS_DIR)) {
    fs.mkdirSync(TICKETS_DIR, { recursive: true })
  }
  if (!fs.existsSync(USER_TICKETS_DIR)) {
    fs.mkdirSync(USER_TICKETS_DIR, { recursive: true })
  }
  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    fs.mkdirSync(TRANSCRIPTS_DIR, { recursive: true })
  }
}
module.exports = {
  name: "ticket",
  /**
   * @param {Client} client
   */
  init(client) {
    ensureDirectoriesExist()
    console.log("Ticket module initialized")
    this.cleanupOrphanedTickets()
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async createTicketPanel(interaction, client) {
    const embed = new EmbedBuilder()
      .setColor(ticketConfig.embed.panel.color)
      .setTitle(ticketConfig.panelTitle)
      .setDescription(ticketConfig.panelDescription)
    if (ticketConfig.embed.panel.showTimestamp) {
      embed.setTimestamp()
    }
    if (ticketConfig.embed.panel.footer) {
      embed.setFooter({
        text: ticketConfig.embed.panel.footer,
        iconURL: ticketConfig.embed.panel.footerIconUrl,
      })
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel(ticketConfig.createButtonLabel)
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🎫"),
      new ButtonBuilder()
        .setCustomId("ticket_claim_giveaway")
        .setLabel(ticketConfig.giveawayClaimButtonLabel)
        .setStyle(ButtonStyle.Success)
        .setEmoji(ticketConfig.giveawayClaimButtonEmoji),
    )
    const sentMessage = await interaction.channel.send({
      embeds: [embed],
      components: [row],
    })
    process.env.TICKET_CHANNEL_ID = interaction.channel.id
    const giveawayConfig = require("../config/giveaway")
    giveawayConfig.winnerTicketChannelId = interaction.channel.id
    const configPath = path.join(__dirname, "../config/giveaway.js")
    const configContent = `module.exports = ${JSON.stringify(giveawayConfig, null, 2)}`
    try {
      fs.writeFileSync(configPath, configContent)
      console.log(`Updated giveaway config with ticket channel ID: ${interaction.channel.id}`)
    } catch (error) {
      console.error("Error updating giveaway config:", error)
    }
    await interaction.reply({
      content: `Ticket panel has been created! This channel (<#${interaction.channel.id}>) will now also be used for giveaway claims.`,
      ephemeral: true,
    })
    return sentMessage
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleButtonInteraction(interaction, client) {
    console.log(`Button interaction received: ${interaction.customId}`)
    if (interaction.customId === "ticket_create") {
      await this.showTicketTypeSelection(interaction)
    } else if (interaction.customId === "ticket_close") {
      await this.closeTicket(interaction, client)
    } else if (interaction.customId === "ticket_delete") {
      await this.deleteTicket(interaction, client)
    } else if (interaction.customId === "ticket_claim_giveaway") {
      console.log("Claim giveaway button clicked by:", interaction.user.tag)
      await this.showGiveawayClaimModal(interaction)
    } else if (interaction.customId === "ticket_reopen") {
      const ticketData = this.getTicket(interaction.channel.id)
      if (ticketData && ticketData.status === "closed") {
        ticketData.status = "open"
        delete ticketData.closedBy
        delete ticketData.closedAt
        this.saveTicket(interaction.channel.id, ticketData)
        this.saveUserTicket(ticketData.userId, ticketData)
        try {
          await interaction.channel.permissionOverwrites.edit(ticketData.userId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          })
        } catch (error) {
          console.error("Error restoring channel permissions:", error)
        }
        try {
          await interaction.message.delete()
        } catch (err) { console.error("Error deleting old close embed:", err) }
        await interaction.reply({ content: "✅ Ticket reopened!", ephemeral: true })
      } else {
        await interaction.reply({ content: "❌ Ticket is not closed or does not exist.", ephemeral: true })
      }
    } else if (interaction.customId.startsWith("ticket_type_")) {
      const ticketType = interaction.customId.replace("ticket_type_", "")
      await this.createTicketByType(interaction, client, ticketType)
    }
  },
  /**
   * @param {Interaction} interaction
   */
  async showTicketCreationModal(interaction) {
    const modal = new ModalBuilder().setCustomId("ticket_modal_create").setTitle(ticketConfig.modalTitle)
    const subjectInput = new TextInputBuilder()
      .setCustomId("ticket_subject")
      .setLabel("Subject")
      .setPlaceholder("Enter a subject for your ticket")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
    const descriptionInput = new TextInputBuilder()
      .setCustomId("ticket_description")
      .setLabel("Description")
      .setPlaceholder("Describe your issue in detail")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
    modal.addComponents(
      new ActionRowBuilder().addComponents(subjectInput),
      new ActionRowBuilder().addComponents(descriptionInput),
    )
    await interaction.showModal(modal)
  },
  /**
   * @param {Interaction} interaction
   */
  async showGiveawayClaimModal(interaction) {
    console.log("Showing giveaway claim modal to:", interaction.user.tag)
    const modal = new ModalBuilder().setCustomId("ticket_modal_claim_giveaway").setTitle("Claim Prize")
    const codeInput = new TextInputBuilder()
      .setCustomId("ticket_code")
      .setLabel("Verification Code")
      .setPlaceholder("Enter the code you received via DM")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
    const descriptionInput = new TextInputBuilder()
      .setCustomId("ticket_description")
      .setLabel("Description")
      .setPlaceholder("Additional information about your prize (optional)")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(descriptionInput),
    )
    await interaction.showModal(modal)
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleModalSubmit(interaction, client) {
    console.log(`Modal submit received: ${interaction.customId}`)
    if (interaction.customId === "ticket_modal_create") {
      await this.createTicket(interaction, client)
    } else if (interaction.customId === "ticket_modal_claim_giveaway") {
      console.log("Giveaway claim modal submitted by:", interaction.user.tag)
      const code = interaction.fields.getTextInputValue("ticket_code")
      const description = interaction.fields.getTextInputValue("ticket_description") || ""
      const giveawayModule = require("./giveaway")
      const validation = await giveawayModule.validateWinnerCode(client, interaction.user.id, code)
      if (!validation.valid) {
        return interaction.reply({
          content: validation.message,
          ephemeral: true,
        })
      }
      await this.createWinnerTicket(interaction, client, validation.prize, description, validation.giveawayId)
    }
  },
  /**
   * @param {string} channelId
   * @param {Object} ticketData
   */
  saveTicket(channelId, ticketData) {
    ensureDirectoriesExist()
    const filePath = path.join(TICKETS_DIR, `${channelId}.json`)
    console.log(`Saving ticket to file: ${filePath}`)
    fs.writeFileSync(filePath, JSON.stringify(ticketData, null, 2))
    console.log(`Ticket saved to file successfully`)
  },
  /**
   * @param {string} channelId
   * @returns {Object|null}
   */
  getTicket(channelId) {
    try {
      const filePath = path.join(TICKETS_DIR, `${channelId}.json`)
      console.log(`Looking for ticket file: ${filePath}`)
      if (!fs.existsSync(filePath)) {
        console.log(`Ticket file does not exist: ${filePath}`)
        return null
      }
      const fileContent = fs.readFileSync(filePath, "utf8")
      const ticketData = JSON.parse(fileContent)
      console.log(`Found ticket data:`, ticketData)
      
      // Return ticket data regardless of status (needed for reopen functionality)
      console.log(`Returning ticket for channel: ${channelId}, status: ${ticketData.status}`)
      return ticketData
    } catch (error) {
      console.error(`Error getting ticket ${channelId}:`, error)
      return null
    }
  },
  /**
   * @param {string} channelId
   */
  deleteTicketFile(channelId) {
    try {
      const filePath = path.join(TICKETS_DIR, `${channelId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`Error deleting ticket ${channelId}:`, error)
    }
  },
  /**
   * @param {string} userId
   * @param {Object} ticketData
   */
  saveUserTicket(userId, ticketData) {
    ensureDirectoriesExist()
    const filePath = path.join(USER_TICKETS_DIR, `${userId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(ticketData, null, 2))
  },
  /**
   * @param {string} userId
   * @returns {Object|null}
   */
  getUserTicket(userId) {
    try {
      const filePath = path.join(USER_TICKETS_DIR, `${userId}.json`)
      console.log(`Looking for user ticket file: ${filePath}`)
      if (!fs.existsSync(filePath)) {
        console.log(`User ticket file does not exist for user: ${userId}`)
        return null
      }
      const fileContent = fs.readFileSync(filePath, "utf8")
      const userTicketData = JSON.parse(fileContent)
      console.log(`Found user ticket data:`, userTicketData)
      console.log(`Returning user ticket for user: ${userId}, status: ${userTicketData.status}`)
      return userTicketData
    } catch (error) {
      console.error(`Error getting user ticket ${userId}:`, error)
      return null
    }
  },
  /**
   * @param {string} userId
   */
  deleteUserTicket(userId) {
    try {
      const filePath = path.join(USER_TICKETS_DIR, `${userId}.json`)
      console.log(`Attempting to delete user ticket file: ${filePath}`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`Successfully deleted user ticket file for user: ${userId}`)
      } else {
        console.log(`User ticket file does not exist for user: ${userId}`)
      }
    } catch (error) {
      console.error(`Error deleting user ticket ${userId}:`, error)
    }
  },
  async createTicket(interaction, client) {
    try {
      console.log("Starting ticket creation process...")
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true })
      }
      const subject = interaction.fields.getTextInputValue("ticket_subject")
      const description = interaction.fields.getTextInputValue("ticket_description")
      console.log(`Creating ticket with subject: ${subject}`)
      console.log(`Checking for existing ticket for user: ${interaction.user.id}`)
      const existingTicket = await this.getUserTicket(interaction.user.id)
      if (existingTicket) {
        console.log(`Found existing ticket:`, existingTicket)
        if (existingTicket.status === "open") {
          const reply = await interaction.editReply({
            content: `You already have an open ticket: <#${existingTicket.channelId}>`,
          })
          setTimeout(() => {
            reply.delete().catch((err) => console.error("Error deleting ticket message:", err))
          }, 5000)
          return
        } else if (existingTicket.status === "closed") {
          console.log(`User has a closed ticket, allowing new ticket creation`)
        }
      } else {
        console.log(`No existing ticket found for user: ${interaction.user.id}`)
      }
      let categoryId = null
      if (ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID) {
        categoryId = ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID
      } else {
        const categories = interaction.guild.channels.cache.filter((channel) => channel.type === 4)
        const category = categories.first()
        if (!category) {
          return interaction.editReply({
            content:
              "No category found in the server. Please create a category first or set one with `/ticket set option:Ticket-Category`.",
          })
        }
        categoryId = category.id
      }
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: process.env.ADMIN_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ]
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        for (const roleId of ticketConfig.permissions.supportRoleIds) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          })
        }
      }
      console.log(`Creating ticket channel with name: ticket-${interaction.user.username}`)
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: permissionOverwrites,
      })
      console.log(`Ticket channel created: ${ticketChannel.id}`)
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.ticket.color)
        .setTitle(`🎫 New Ticket: ${subject}`)
        .setDescription(`📝 **Description:**\n${description}`)
        .addFields(
          { name: "👤 Created by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📅 Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: "🆔 Ticket ID", value: ticketChannel.id, inline: true },
        )
      if (ticketConfig.embed.ticket.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.ticket.footer) {
        embed.setFooter({
          text: ticketConfig.embed.ticket.footer,
          iconURL: ticketConfig.embed.ticket.footerIconUrl,
        })
      }
      let messageContent = `<@${process.env.ADMIN_ID}>`
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        messageContent += ` <@&${ticketConfig.permissions.supportRoleIds.join("> <@&")}>`
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      )
      await ticketChannel.send({
        content: messageContent,
        embeds: [embed],
        components: [row],
      })
      const ticketData = {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        guildId: interaction.guild.id,
        subject,
        description,
        createdAt: Date.now(),
        status: "open",
        ticketType: "standard",
      }
      console.log(`Saving ticket data for channel: ${ticketChannel.id}`, ticketData)
      this.saveTicket(ticketChannel.id, ticketData)
      this.saveUserTicket(interaction.user.id, ticketData)
      console.log(`Ticket saved successfully for channel: ${ticketChannel.id}`)
      const savedTicket = this.getTicket(ticketChannel.id)
      if (savedTicket) {
        console.log(`Ticket verification successful: ${savedTicket.channelId}`)
      } else {
        console.error(`Ticket verification failed for channel: ${ticketChannel.id}`)
      }
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        await this.logTicketAction(client, ticketData, "created", interaction.user.id)
      }
      await interaction.editReply({
        content: `${ticketConfig.messages.ticketCreated.replace("{channel}", `<#${ticketChannel.id}>`)}`,
      })
    } catch (error) {
      console.error("Error creating ticket:", error)
      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: "An error occurred while creating the ticket.",
          })
          .catch(console.error)
      } else {
        await interaction
          .reply({
            content: "An error occurred while creating the ticket.",
            ephemeral: true,
          })
          .catch(console.error)
      }
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async closeTicket(interaction, client) {
    try {
      if (interaction.replied || interaction.deferred) {
        console.log("Interaction already replied to, skipping")
        return
      }

      console.log(`Attempting to close ticket for channel: ${interaction.channel.id}`)
      let ticketData = this.getTicket(interaction.channel.id)
      console.log(`Ticket data found:`, ticketData)
      
      if (!ticketData) {
        console.log(`No ticket data found for channel: ${interaction.channel.id}`)
        if (interaction.channel.name.startsWith('ticket-') || interaction.channel.name.startsWith('general-') || interaction.channel.name.startsWith('technical-') || interaction.channel.name.startsWith('custom-') || interaction.channel.name.startsWith('prize-')) {
          console.log(`This appears to be a ticket channel but no data found. Creating emergency ticket data.`)
          const emergencyTicketData = {
            userId: interaction.user.id,
            channelId: interaction.channel.id,
            guildId: interaction.guild.id,
            subject: "Emergency Ticket",
            description: "Ticket created without proper data",
            createdAt: Date.now(),
            status: "open",
            ticketType: "emergency",
          }
          this.saveTicket(interaction.channel.id, emergencyTicketData)
          ticketData = emergencyTicketData
        } else {
          return interaction.reply({
            content: "This ticket does not exist in the database.",
            ephemeral: true,
          })
        }
      }

      const isAdmin = interaction.user.id === process.env.ADMIN_ID
      const isSupport =
        ticketConfig.permissions.supportRoleIds &&
        ticketConfig.permissions.supportRoleIds.some((roleId) => interaction.member.roles.cache.has(roleId))
      const isTicketCreator = interaction.user.id === ticketData.userId

      if (!isAdmin && !isSupport && !isTicketCreator) {
        return interaction.reply({
          content: "You don't have permission to close this ticket.",
          ephemeral: true,
        })
      }

      

      // Update ticket status
      ticketData.status = "closed"
      ticketData.closedBy = interaction.user.id
      ticketData.closedAt = Date.now()
      console.log(`Updating ticket status to closed for channel: ${interaction.channel.id}`)
      this.saveTicket(interaction.channel.id, ticketData)
      console.log(`Updating user ticket status to closed for user: ${ticketData.userId}`)
      this.saveUserTicket(ticketData.userId, ticketData)

      // Log the ticket closure
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        console.log("Sending log message for ticket closure...")
        try {
          await this.logTicketAction(client, ticketData, "closed", interaction.user.id, transcriptAttachment)
          console.log("Log message sent successfully")
        } catch (logError) {
          console.error("Error sending log message:", logError)
        }
      }

      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.close.color)
        .setTitle(`🔒 Ticket Closed`)
        .setDescription(`This ticket will be deleted in 10 seconds by <@${interaction.user.id}>.`)
        .addFields(
          { name: "👤 Closed by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📅 Closed at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: "🆔 Ticket ID", value: ticketData.channelId, inline: true },
        )
      if (ticketConfig.embed.close.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.close.footer) {
        embed.setFooter({
          text: ticketConfig.embed.close.footer,
          iconURL: ticketConfig.embed.close.footerIconUrl,
        })
      }
      try {
        await interaction.reply({
          embeds: [embed],
        })
        console.log("Successfully replied to close interaction")
      } catch (error) {
        console.error("Error replying to interaction:", error)
        try {
          await interaction.channel.send({
            content: `Ticket closed by <@${interaction.user.id}>`,
            embeds: [embed],
          })
          console.log("Sent close message to channel instead")
        } catch (sendError) {
          console.error("Error sending message to channel:", sendError)
        }
        return
      }
      setTimeout(async () => {
        try {
          let transcriptAttachment = null
          if (ticketConfig.transcript && ticketConfig.transcript.enabled) {
            try {
              transcriptAttachment = await this.createTranscript(client, ticketData)
            } catch (error) {
              console.error("Error creating transcript for auto-deletion:", error)
            }
          }
          // Ticket Closed Embed (mit Transkript)
          let messageContent = ticketConfig.dmNotification.message
          if (ticketConfig.dmNotification.ratingEnabled) {
            const ratingLink = ticketConfig.dmNotification.ratingLink
            const ratingMessage = ticketConfig.dmNotification.ratingMessage.replace("{ratingLink}", ratingLink)
            messageContent += "\n\n" + ratingMessage
          }
          
          const closedEmbed = new EmbedBuilder()
            .setColor(ticketConfig.dmNotification.embed.color)
            .setTitle(ticketConfig.dmNotification.embed.title)
            .setDescription(messageContent)
            .addFields(
              { name: "👤 Closed by", value: `<@${interaction.user.id}>`, inline: true },
              { name: "📅 Closed at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
              { name: "🆔 Ticket ID", value: ticketData.channelId, inline: true },
            )
          if (ticketConfig.dmNotification.embed.showTimestamp) {
            closedEmbed.setTimestamp()
          }
          if (ticketConfig.dmNotification.embed.footer) {
            closedEmbed.setFooter({
              text: ticketConfig.dmNotification.embed.footer,
              iconURL: ticketConfig.dmNotification.embed.footerIconUrl,
            })
          }

          // Send DM notification with transcript to the ticket creator
          if (ticketConfig.enableDMNotification && ticketConfig.dmNotification.enabled) {
            try {
              const user = await client.users.fetch(ticketData.userId).catch(() => null)
              if (user) {
                await user.send({ embeds: [closedEmbed], files: transcriptAttachment ? [transcriptAttachment] : [] })
              }
            } catch (dmError) {
              console.error("Error sending DM notification:", dmError)
            }
          }

          // Log the ticket closure with transcript
          if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
            try {
              await this.logTicketAction(client, ticketData, "closed", interaction.user.id, transcriptAttachment)
            } catch (logError) {
              console.error("Error sending log message:", logError)
            }
          }

          // Delete ticket files
          this.deleteTicketFile(interaction.channel.id)
          this.deleteUserTicket(ticketData.userId)
          console.log("Deleted ticket files from database")

          // Delete the channel
          if (interaction.channel) {
            await interaction.channel.delete().catch((error) => {
              console.error("Error deleting channel:", error)
            })
          }
        } catch (error) {
          console.error("Error in auto-deletion:", error)
        }
      }, 10000)
    } catch (error) {
      console.error("Error closing ticket:", error)
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "An error occurred while closing the ticket.",
          ephemeral: true,
        }).catch(console.error)
      }
    }
  },
  async deleteTicket(interaction, client) {
    try {
      console.log(`Attempting to delete ticket for channel: ${interaction.channel.id}`)
      const ticketData = this.getTicket(interaction.channel.id)
      if (!ticketData) {
        console.log(`No ticket data found for channel: ${interaction.channel.id}`)
        return interaction.reply({
          content: "This ticket does not exist in the database.",
          ephemeral: true,
        })
      }
      const isAdmin = interaction.user.id === process.env.ADMIN_ID
      const isSupport =
        ticketConfig.permissions.supportRoleIds &&
        ticketConfig.permissions.supportRoleIds.some((roleId) => interaction.member.roles.cache.has(roleId))

      if (!isAdmin && !isSupport) {
        return interaction.reply({
          content: "You don't have permission to delete this ticket.",
          ephemeral: true,
        })
      }
      
      console.log("Permissions verified, proceeding with deletion")
      let transcriptAttachment = null
      if (ticketConfig.transcript && ticketConfig.transcript.enabled) {
        console.log("Creating transcript for deletion...")
        try {
          transcriptAttachment = await this.createTranscript(client, ticketData)
          console.log("Transcript created successfully for deletion")
        } catch (error) {
          console.error("Error creating transcript for deletion:", error)
        }
      }
      if (ticketConfig.enableDMNotification && ticketConfig.dmNotification.enabled) {
        console.log("Sending DM notification for deletion...")
        try {
          await this.sendTicketClosedDM(client, ticketData, interaction.guild, transcriptAttachment)
          console.log("DM notification sent successfully")
        } catch (dmError) {
          console.error("Error sending DM notification:", dmError)
        }
      }
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        console.log("Sending log message...")
        try {
          await this.sendTicketDeletedLog(client, ticketData, transcriptAttachment, interaction.user.id) // Don't send transcript to log channel
          console.log("Log message sent successfully")
        } catch (logError) {
          console.error("Error sending log message:", logError)
        }
      }
      try {
        await interaction.channel.send({
          content: ticketConfig.messages.ticketDeleted.replace("{seconds}", ticketConfig.deleteDelay),
        })
        console.log("Sent deletion message to channel")
      } catch (sendError) {
        console.error("Error sending deletion message:", sendError)
      }
      this.deleteTicketFile(interaction.channel.id)
      this.deleteUserTicket(ticketData.userId)
      console.log("Deleted ticket files from database")
      setTimeout(async () => {
        try {
          if (interaction.channel) {
            await interaction.channel.delete().catch((error) => {
              console.error("Error deleting channel:", error)
            })
            console.log("Channel deleted successfully")
          }
        } catch (error) {
          console.error("Error in channel deletion timeout:", error)
        }
      }, ticketConfig.deleteDelay * 1000)
    } catch (error) {
      console.error("Error deleting ticket:", error)
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction
            .reply({
              content: "An error occurred while deleting the ticket.",
              ephemeral: true,
            })
            .catch(console.error)
        }
      } catch (replyError) {
        console.error("Error replying to interaction:", replyError)
        try {
          await interaction.channel.send({
            content: "An error occurred while deleting the ticket.",
          })
        } catch (sendError) {
          console.error("Error sending error message to channel:", sendError)
        }
      }
    }
  },
  /**
   * @param {Client} client
   * @param {Object} ticketData
   * @param {string} action
   * @param {string} userId
   * @param {AttachmentBuilder|null} transcriptAttachment
   */
  async logTicketAction(client, ticketData, action, userId, transcriptAttachment = null) {
    try {
      if (!ticketConfig.enableLogs || !ticketConfig.logChannelId) {
        return
      }
      const logChannel = await client.channels.fetch(ticketConfig.logChannelId).catch(() => null)
      if (!logChannel) {
        console.error(`Log channel ${ticketConfig.logChannelId} not found`)
        return
      }
      const actionUser = await client.users.fetch(userId).catch(() => null)
      const actionUserName = actionUser ? actionUser.tag : "Unknown User"
      const ticketCreator = await client.users.fetch(ticketData.userId).catch(() => null)
      const creatorName = ticketCreator ? ticketCreator.tag : "Unknown User"
      
      // Create action-specific emoji and title
      let actionEmoji, actionTitle, embedColor
      if (action === "created") {
        actionEmoji = "🎫"
        actionTitle = "Ticket Created"
        embedColor = ticketConfig.embed.log.color || "#00ff00"
      } else if (action === "closed") {
        actionEmoji = "🔒"
        actionTitle = "Ticket Closed"
        embedColor = ticketConfig.embed.log.color || "#ff9900"
      } else if (action === "deleted") {
        actionEmoji = "🗑️"
        actionTitle = "Ticket Deleted"
        embedColor = ticketConfig.embed.log.color || "#ff0000"
      }
      
      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`${actionEmoji} ${actionTitle}`)
        .addFields(
          { name: "🆔 Ticket ID", value: ticketData.channelId, inline: true },
          { name: "📋 Ticket Type", value: ticketData.ticketType || "Standard", inline: true },
          { name: "👤 Created by", value: `${creatorName} (${ticketData.userId})`, inline: true },
          { name: "📅 Created at", value: `<t:${Math.floor(ticketData.createdAt / 1000)}:F>`, inline: true },
          { name: "⚡ Action performed by", value: `${actionUserName} (${userId})`, inline: true },
          { name: "⏰ Action performed at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
      if (ticketData.subject) {
        embed.addFields({ name: "📝 Subject", value: ticketData.subject })
      }
      if (ticketData.isGiveawayWinner) {
        embed.addFields({ name: "🎁 Prize", value: ticketData.prize || "Unknown" })
      }
      if (ticketConfig.embed.log.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.log.footer) {
        embed.setFooter({
          text: ticketConfig.embed.log.footer,
          iconURL: ticketConfig.embed.log.footerIconUrl,
        })
      }
      
      const logOptions = { embeds: [embed] }
      if (transcriptAttachment) {
        logOptions.files = [transcriptAttachment]
      }
      
      await logChannel.send(logOptions)
    } catch (error) {
      console.error("Error logging ticket action:", error)
    }
  },
  async createWinnerTicket(interaction, client, prize, description = "", giveawayId = null) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true })
      }
      const existingTicket = await this.getUserTicket(interaction.user.id)
      if (existingTicket) {
        const reply = await interaction.editReply({
          content: `You already have an open ticket: <#${existingTicket.channelId}>`,
        })
        setTimeout(() => {
          reply.delete().catch((err) => console.error("Error deleting ticket message:", err))
        }, 5000)
        return null
      }
      let categoryId = null
      if (ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID) {
        categoryId = ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID
      } else {
        const categories = interaction.guild.channels.cache.filter((channel) => channel.type === 4)
        const category = categories.first()
        if (!category) {
          return interaction.editReply({
            content:
              "No category found in the server. Please create a category first or set one with `/ticket set option:Ticket-Category`.",
          })
        }
        categoryId = category.id
      }
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: process.env.ADMIN_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ]
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        for (const roleId of ticketConfig.permissions.supportRoleIds) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          })
        }
      }
      const ticketChannel = await interaction.guild.channels.create({
        name: `prize-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: permissionOverwrites,
      })
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.giveaway.color)
        .setTitle(`🎁 Prize Ticket: ${prize}`)
        .setDescription(
          `🎉 Congratulations <@${interaction.user.id}> on your prize!\nA team member will assist you with the delivery shortly.`,
        )
        .addFields(
          { name: "🏆 Winner", value: `<@${interaction.user.id}>`, inline: true },
          { name: "🎁 Prize", value: prize, inline: true },
          { name: "📅 Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
      if (description) {
        embed.addFields({ name: "📝 Description", value: description })
      }
      if (giveawayId) {
        embed.addFields({ name: "🆔 Giveaway ID", value: giveawayId, inline: true })
      }
      embed.addFields({ name: "🆔 Ticket ID", value: ticketChannel.id, inline: true })
      if (ticketConfig.embed.giveaway.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.giveaway.footer) {
        embed.setFooter({
          text: ticketConfig.embed.giveaway.footer,
          iconURL: ticketConfig.embed.giveaway.footerIconUrl,
        })
      }
      let messageContent = `<@${process.env.ADMIN_ID}>`
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        messageContent += ` <@&${ticketConfig.permissions.supportRoleIds.join("> <@&")}>`
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      )
      await ticketChannel.send({
        content: messageContent,
        embeds: [embed],
        components: [row],
      })
      const ticketData = {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        guildId: interaction.guild.id,
        subject: `Prize: ${prize}`,
        createdAt: Date.now(),
        status: "open",
        isGiveawayWinner: true,
        prize: prize,
        giveawayId: giveawayId,
        ticketType: "giveaway",
      }
      this.saveTicket(ticketChannel.id, ticketData)
      this.saveUserTicket(interaction.user.id, ticketData)
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        await this.logTicketAction(client, ticketData, "created", interaction.user.id)
      }
      await interaction.editReply({
        content: `Your prize ticket has been created: <#${ticketChannel.id}>`,
      })
      return ticketChannel
    } catch (error) {
      console.error("Error creating winner ticket:", error)
      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: `An error occurred while creating the ticket: ${error.message}`,
          })
          .catch(console.error)
      } else {
        await interaction
          .reply({
            content: `An error occurred while creating the ticket: ${error.message}`,
            ephemeral: true,
          })
          .catch(console.error)
      }
      return null
    }
  },
  /**
   * @param {number} type
   * @returns {string}
   */
  getChannelTypeName(type) {
    const types = {
      0: "Text",
      1: "DM",
      2: "Voice",
      3: "Group DM",
      4: "Category",
      5: "Announcement",
      10: "Announcement Thread",
      11: "Public Thread",
      12: "Private Thread",
      13: "Stage",
      14: "Forum",
      15: "Media",
    }
    return types[type] || "Unknown"
  },
  async showTicketTypeSelection(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_type_general")
        .setLabel("General Support")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("🔧"),
      new ButtonBuilder()
        .setCustomId("ticket_type_technical")
        .setLabel("Technical Support")
        .setStyle(ButtonStyle.Success)
        .setEmoji("💻"),
      new ButtonBuilder()
        .setCustomId("ticket_type_custom")
        .setLabel("Custom Support")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("🎨"),
    )
    const embed = new EmbedBuilder()
      .setColor(ticketConfig.embed.panel.color)
      .setTitle("Select Support Type")
      .setDescription("Please select the type of support you need.")
      .setTimestamp()
    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    })
  },
  async createTicketByType(interaction, client, ticketType) {
    try {
      console.log(`Creating ticket by type: ${ticketType}`)
      if (!interaction.deferred && !interaction.replied) {
        try {
          await interaction.reply({ content: "Creating ticket...", ephemeral: true })
        } catch (error) {
          console.error("Error replying to interaction:", error)
          return
        }
      }
      const ticketTypeNames = {
        general: "General Support",
        technical: "Technical Support",
        custom: "Custom Support",
      }
      const typeName = ticketTypeNames[ticketType] || "Support"
      console.log(`Checking for existing ticket for user: ${interaction.user.id}`)
      const existingTicket = await this.getUserTicket(interaction.user.id)
      if (existingTicket) {
        console.log(`Found existing ticket:`, existingTicket)
        const reply = await interaction.editReply({
          content: `You already have an open ticket: <#${existingTicket.channelId}>`,
          components: [],
          embeds: [],
        })
        setTimeout(() => {
          reply.delete().catch((err) => console.error("Error deleting ticket message:", err))
        }, 5000)
        return
      } else {
        console.log(`No existing ticket found for user: ${interaction.user.id}`)
      }
      let categoryId = null
      if (ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID) {
        categoryId = ticketConfig.ticketCategoryId || process.env.TICKET_CATEGORY_ID
      } else {
        const categories = interaction.guild.channels.cache.filter((channel) => channel.type === 4)
        const category = categories.first()
        if (!category) {
          return interaction.editReply({
            content:
              "No category found in the server. Please create a category first or set one with `/ticket set option:Ticket-Category`.",
          })
        }
        categoryId = category.id
      }
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        {
          id: process.env.ADMIN_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ]
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        for (const roleId of ticketConfig.permissions.supportRoleIds) {
          permissionOverwrites.push({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          })
        }
      }
      const ticketChannel = await interaction.guild.channels.create({
        name: `${ticketType}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: permissionOverwrites,
      })
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.ticket.color)
        .setTitle(`🎫 ${typeName} Ticket`)
        .setDescription(`👋 Hello <@${interaction.user.id}>,

Thank you for your request. A team member will assist you shortly.

In the meantime, please describe your issue in as much detail as possible so we can help you quickly.`)
        .addFields(
          { name: "📋 Ticket Type", value: typeName, inline: true },
          { name: "👤 Created by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "📅 Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: "🆔 Ticket ID", value: ticketChannel.id, inline: true },
        )
      if (ticketConfig.embed.ticket.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.ticket.footer) {
        embed.setFooter({
          text: ticketConfig.embed.ticket.footer,
          iconURL: ticketConfig.embed.ticket.footerIconUrl,
        })
      }
      let messageContent = `<@${process.env.ADMIN_ID}>`
      if (ticketConfig.permissions.supportRoleIds && ticketConfig.permissions.supportRoleIds.length > 0) {
        messageContent += ` <@&${ticketConfig.permissions.supportRoleIds.join("> <@&")}>`
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔒"),
      )
      await ticketChannel.send({
        content: messageContent,
        embeds: [embed],
        components: [row],
      })
      const ticketData = {
        userId: interaction.user.id,
        channelId: ticketChannel.id,
        guildId: interaction.guild.id,
        subject: typeName,
        ticketType: ticketType,
        createdAt: Date.now(),
        status: "open",
      }
      console.log(`Saving ticket data for channel: ${ticketChannel.id}`, ticketData)
      this.saveTicket(ticketChannel.id, ticketData)
      this.saveUserTicket(interaction.user.id, ticketData)
      console.log(`Ticket saved successfully for channel: ${ticketChannel.id}`)
      const savedTicket = this.getTicket(ticketChannel.id)
      if (savedTicket) {
        console.log(`Ticket verification successful: ${savedTicket.channelId}`)
      } else {
        console.error(`Ticket verification failed for channel: ${ticketChannel.id}`)
      }
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        await this.logTicketAction(client, ticketData, "created", interaction.user.id)
      }
      await interaction.editReply({
        content: `Your ${typeName} ticket has been created: <#${ticketChannel.id}>`,
        components: [],
        embeds: [],
      })
    } catch (error) {
      console.error("Error creating ticket:", error)
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction
            .editReply({
              content: "An error occurred while creating the ticket.",
            })
            .catch(console.error)
        } else {
          await interaction
            .reply({
              content: "An error occurred while creating the ticket.",
              ephemeral: true,
            })
            .catch(console.error)
        }
      } catch (replyError) {
        console.error("Error replying to interaction:", replyError)
        try {
          await interaction.channel.send({
            content: "An error occurred while creating the ticket.",
          })
        } catch (sendError) {
          console.error("Error sending error message:", sendError)
        }
      }
    }
  },
  /**
   * @param {Message} message
   */
  async safeMessageDelete(message) {
    if (!message) return
    try {
      await message.delete()
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  },
  /**
   * @param {Client} client
   * @param {Object} ticketData
   * @param {Guild} guild
   */
  async sendTicketClosedDM(client, ticketData, guild, transcriptAttachment = null) {
    try {
      console.log(`Attempting to send DM to user ${ticketData.userId}...`)
      const user = await client.users.fetch(ticketData.userId).catch(() => null)
      if (!user) {
        console.error(`Could not fetch user ${ticketData.userId} for DM notification`)
        return
      }
      console.log(`Found user: ${user.tag}`)
      let messageContent = ticketConfig.dmNotification.message
      if (ticketConfig.dmNotification.ratingEnabled) {
        const ratingLink = ticketConfig.dmNotification.ratingLink
        const ratingMessage = ticketConfig.dmNotification.ratingMessage.replace("{ratingLink}", ratingLink)
        messageContent += "\n\n" + ratingMessage
      }
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.dmNotification.embed.color)
        .setTitle(ticketConfig.dmNotification.embed.title)
        .setDescription(messageContent)
      if (ticketConfig.dmNotification.embed.showTimestamp) {
        embed.setTimestamp()
      }

      if (ticketConfig.dmNotification.embed.footer) {
        embed.setFooter({
          text: ticketConfig.dmNotification.embed.footer,
          iconURL: ticketConfig.dmNotification.embed.footerIconUrl,
        })
      }
      console.log("Preparing DM options...")
      const dmOptions = {
        content: `<@${ticketData.userId}>`,
        embeds: [embed]
      }
      
      if (transcriptAttachment) {
        dmOptions.files = [transcriptAttachment]
        console.log("Sending DM with transcript attachment")
      } else {
        console.log("Sending DM without transcript attachment")
      }
      console.log("Sending DM to user...")
      await user.send(dmOptions)
      
      console.log(`Sent ticket closed DM to ${user.tag} (${ticketData.userId})`)
    } catch (error) {
      console.error(`Error sending ticket closed DM to user ${ticketData.userId}:`, error)
      if (transcriptAttachment) {
        try {
          console.log("Retrying DM without transcript...")
          const retryEmbed = new EmbedBuilder()
            .setColor(ticketConfig.dmNotification.embed.color)
            .setTitle(ticketConfig.dmNotification.embed.title)
            .setDescription(ticketConfig.dmNotification.message)
          if (ticketConfig.dmNotification.embed.showTimestamp) {
            retryEmbed.setTimestamp()
          }
          if (ticketConfig.dmNotification.embed.footer) {
            retryEmbed.setFooter({
              text: ticketConfig.dmNotification.embed.footer,
              iconURL: ticketConfig.dmNotification.embed.footerIconUrl,
            })
          }
          await user.send({
            content: `<@${ticketData.userId}>`,
            embeds: [retryEmbed]
          })
          console.log(`Sent ticket closed DM without transcript to ${user.tag} (${ticketData.userId})`)
        } catch (retryError) {
          console.error(`Error sending DM without transcript:`, retryError)
        }
      }
      const isDMDisabled =
        error.message &&
        (error.message.includes("Cannot send messages to this user") ||
          error.message.includes("Missing Access") ||
          error.message.includes("Forbidden"))
      
      if (isDMDisabled) {
        console.log(`User ${ticketData.userId} has DMs disabled or blocked the bot`)
      }
    }
  },
  /**
   * @param {Client} client
   * @param {Object} ticketData
   * @returns {Promise<AttachmentBuilder|null>}
   */
  async createTranscript(client, ticketData) {
    try {
      console.log(`Creating transcript for channel: ${ticketData.channelId}`)
      const channel = await client.channels.fetch(ticketData.channelId).catch(() => null)
      if (!channel) {
        console.error(`Could not fetch channel ${ticketData.channelId} for transcript`)
        return null
      }
      console.log(`Successfully fetched channel: ${channel.name}`)
      console.log(`Fetching messages for transcript...`)
      const messages = await channel.messages.fetch({ limit: ticketConfig.transcript.maxMessages })
      console.log(`Found ${messages.size} messages`)
      const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      const supporterRoleIds = ticketConfig.permissions.supportRoleIds || []
      const botId = client.user.id
      let transcript = ''
      transcript += `=== TICKET TRANSCRIPT ===\n`
      transcript += `Ticket ID: ${ticketData.channelId}\n`
      transcript += `Created by: ${ticketData.userId}\n`
      transcript += `Created at: ${new Date(ticketData.createdAt).toLocaleString()}\n`
      transcript += `Status: ${ticketData.status}\n`
      transcript += `Subject: ${ticketData.subject || 'N/A'}\n`
      transcript += `Type: ${ticketData.ticketType || 'Standard'}\n`
      transcript += `\n=== MESSAGES ===\n\n`
      for (const message of sortedMessages.values()) {
        if (message.author.id === botId) {
          continue
        }
        const isTicketCreator = message.author.id === ticketData.userId
        const isSupporter = message.member && message.member.roles.cache.some(role => supporterRoleIds.includes(role.id))
        if (!isTicketCreator && !isSupporter) {
          continue
        }
        const timestamp = new Date(message.createdTimestamp).toLocaleString()
        const author = message.author.tag
        const content = message.content || '[No text content]'
        transcript += `[${timestamp}] ${author}:\n${content}\n`
        if (ticketConfig.transcript.includeEmbeds && message.embeds.length > 0) {
          for (const embed of message.embeds) {
            transcript += `[EMBED] ${embed.title || 'No title'}\n`
            if (embed.description) transcript += `${embed.description}\n`
            if (embed.fields && embed.fields.length > 0) {
              for (const field of embed.fields) {
                transcript += `[FIELD] ${field.name}: ${field.value}\n`
              }
            }
          }
        }
        if (ticketConfig.transcript.includeAttachments && message.attachments.size > 0) {
          for (const attachment of message.attachments.values()) {
            transcript += `[ATTACHMENT] ${attachment.name} (${attachment.url})\n`
          }
        }
        transcript += '\n'
      }
      transcript += '\n=== END OF TRANSCRIPT ===\nCreated by @apt_start_latifi 👾 discord.gg/KcuMUUAP5T'
      const fileName = ticketConfig.transcript.fileName.replace('{ticketId}', ticketData.channelId)
      const filePath = path.join(TRANSCRIPTS_DIR, fileName)
      console.log(`Writing transcript to file: ${filePath}`)
      fs.writeFileSync(filePath, transcript, 'utf8')
      console.log(`Transcript written to file successfully`)
      const { AttachmentBuilder } = require('discord.js')
      const attachment = new AttachmentBuilder(filePath, { name: fileName })
      console.log(`Created transcript attachment: ${fileName}`)
      setTimeout(() => {
        try {
          fs.unlinkSync(filePath)
          console.log(`Cleaned up transcript file: ${fileName}`)
        } catch (error) {
          console.error('Error cleaning up transcript file:', error)
        }
      }, 60000) 

      return attachment
    } catch (error) {
      console.error('Error creating transcript:', error)
      return null
    }
  },

  /**
   * Clean up orphaned ticket files
   */
  cleanupOrphanedTickets() {
    try {
      console.log("Cleaning up orphaned ticket files...")
      if (fs.existsSync(TICKETS_DIR)) {
        const ticketFiles = fs.readdirSync(TICKETS_DIR)
        for (const file of ticketFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(TICKETS_DIR, file)
            try {
              const ticketData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
              if (ticketData.status === 'closed') {
                fs.unlinkSync(filePath)
                console.log(`Deleted closed ticket file: ${file}`)
              }
            } catch (error) {
              console.error(`Error processing ticket file ${file}:`, error)
              fs.unlinkSync(filePath)
              console.log(`Deleted corrupted ticket file: ${file}`)
            }
          }
        }
      }
      if (fs.existsSync(USER_TICKETS_DIR)) {
        const userTicketFiles = fs.readdirSync(USER_TICKETS_DIR)
        for (const file of userTicketFiles) {
          if (file.endsWith('.json')) {
            const filePath = path.join(USER_TICKETS_DIR, file)
            try {
              const userTicketData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
              if (userTicketData.status === 'closed') {
                fs.unlinkSync(filePath)
                console.log(`Deleted closed user ticket file: ${file}`)
              }
            } catch (error) {
              console.error(`Error processing user ticket file ${file}:`, error)
              fs.unlinkSync(filePath)
              console.log(`Deleted corrupted user ticket file: ${file}`)
            }
          }
        }
      }
      console.log("Cleanup completed")
    } catch (error) {
      console.error("Error during cleanup:", error)
    }
  },
  /**
   * @param {Client} client
   * @param {Object} ticketData
   */
  async sendTicketDeletedLog(client, ticketData, transcriptAttachment, deletedByUserId) {
    try {
      const logChannel = await client.channels.fetch(ticketConfig.logChannelId).catch(() => null)
      if (!logChannel) {
        console.error(`Log channel ${ticketConfig.logChannelId} not found`)
        return
      }
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.log.color)
        .setTitle("🗑️ Ticket gelöscht")
        .setDescription(`Das Ticket <#${ticketData.channelId}> wurde gelöscht.\n\n👤 <@${ticketData.userId}> | 📝 ${ticketData.subject || 'Kein Betreff'}`)
        .addFields(
          { name: "Typ", value: ticketData.ticketType || "Standard", inline: true },
          { name: "Erstellt am", value: `<t:${Math.floor(ticketData.createdAt / 1000)}:F>`, inline: true },
          { name: "Gelöscht von", value: `<@${deletedByUserId}>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "LatifiMods Support", iconURL: ticketConfig.embed.log.footerIconUrl })
      await logChannel.send({ embeds: [embed] })
      console.log("Ticket deleted log sent successfully")
    } catch (error) {
      console.error("Error sending ticket deleted log:", error)
    }
  },
}