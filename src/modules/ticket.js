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
}
module.exports = {
  name: "ticket",
  /**
   * @param {Client} client
   */
  init(client) {
    ensureDirectoriesExist()
    console.log("Ticket module initialized")
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
    fs.writeFileSync(filePath, JSON.stringify(ticketData, null, 2))
  },
  /**
   * @param {string} channelId
   * @returns {Object|null}
   */
  getTicket(channelId) {
    try {
      const filePath = path.join(TICKETS_DIR, `${channelId}.json`)
      if (!fs.existsSync(filePath)) return null
      const fileContent = fs.readFileSync(filePath, "utf8")
      return JSON.parse(fileContent)
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
      if (!fs.existsSync(filePath)) return null
      const fileContent = fs.readFileSync(filePath, "utf8")
      return JSON.parse(fileContent)
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
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`Error deleting user ticket ${userId}:`, error)
    }
  },
  async createTicket(interaction, client) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true })
      }
      const subject = interaction.fields.getTextInputValue("ticket_subject")
      const description = interaction.fields.getTextInputValue("ticket_description")
      const existingTicket = await this.getUserTicket(interaction.user.id)
      if (existingTicket) {
        const reply = await interaction.editReply({
          content: `You already have an open ticket: <#${existingTicket.channelId}>`,
        })
        setTimeout(() => {
          reply.delete().catch((err) => console.error("Error deleting ticket message:", err))
        }, 5000)
        return
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
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: permissionOverwrites,
      })
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.ticket.color)
        .setTitle(`Ticket: ${subject}`)
        .setDescription(description)
        .addFields(
          { name: "Created by", value: `<@${interaction.user.id}>` },
          { name: "Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
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
      this.saveTicket(ticketChannel.id, ticketData)
      this.saveUserTicket(interaction.user.id, ticketData)
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
      const ticketData = this.getTicket(interaction.channel.id)
      if (!ticketData) {
        return interaction.reply({
          content: "This ticket does not exist in the database.",
          ephemeral: true,
        })
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
      ticketData.status = "closed"
      ticketData.closedBy = interaction.user.id
      ticketData.closedAt = Date.now()
      this.saveTicket(interaction.channel.id, ticketData)
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.close.color)
        .setTitle(ticketConfig.embed.close.title)
        .setDescription(`This ticket was closed by <@${interaction.user.id}>.`)
      if (ticketConfig.embed.close.showTimestamp) {
        embed.setTimestamp()
      }
      if (ticketConfig.embed.close.footer) {
        embed.setFooter({
          text: ticketConfig.embed.close.footer,
          iconURL: ticketConfig.embed.close.footerIconUrl,
        })
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_delete")
          .setLabel("Delete Ticket")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️"),
      )
      try {
        await interaction.reply({
          embeds: [embed],
          components: [row],
        })
      } catch (error) {
        console.error("Error replying to close interaction:", error)
        return
      }
      await interaction.channel.permissionOverwrites.edit(ticketData.userId, {
        ViewChannel: false,
      })
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        await this.logTicketAction(client, ticketData, "closed", interaction.user.id)
      }
      this.deleteUserTicket(ticketData.userId)
    } catch (error) {
      console.error("Error closing ticket:", error)
      await interaction.reply({
        content: "An error occurred while closing the ticket.",
        ephemeral: true,
      })
    }
  },
  async deleteTicket(interaction, client) {
    try {
      const ticketData = this.getTicket(interaction.channel.id)
      if (!ticketData) {
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
      if (ticketConfig.enableLogs && ticketConfig.logChannelId) {
        await this.logTicketAction(client, ticketData, "deleted", interaction.user.id)
      }
      await MessageUtils.sendTemporaryMessage(interaction, {
        content: { content: ticketConfig.messages.ticketDeleted.replace("{seconds}", ticketConfig.deleteDelay) },
        ephemeral: false,
        deleteAfter: ticketConfig.deleteDelay,
      })
      this.deleteTicketFile(interaction.channel.id)
      setTimeout(async () => {
        try {
          if (interaction.channel) {
            await interaction.channel.delete().catch((error) => {
              console.error("Error deleting channel:", error)
            })
          }
        } catch (error) {
          console.error("Error in channel deletion timeout:", error)
        }
      }, ticketConfig.deleteDelay * 1000)
    } catch (error) {
      console.error("Error deleting ticket:", error)
      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: "An error occurred while deleting the ticket.",
            ephemeral: true,
          })
          .catch(console.error)
      }
    }
  },
  /**
   * @param {Client} client
   * @param {Object} ticketData
   * @param {string} action
   * @param {string} userId
   */
  async logTicketAction(client, ticketData, action, userId) {
    try {
      if (!ticketConfig.enableLogs || !ticketConfig.logChannelId) {
        return
      }
      const logChannel = await client.channels.fetch(ticketConfig.logChannelId).catch(() => null)
      if (!logChannel) {
        console.error(`Log channel ${ticketConfig.logChannelId} not found`)
        return
      }
      const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
      const actionUser = await client.users.fetch(userId).catch(() => null)
      const actionUserName = actionUser ? actionUser.tag : "Unknown User"
      const ticketCreator = await client.users.fetch(ticketData.userId).catch(() => null)
      const creatorName = ticketCreator ? ticketCreator.tag : "Unknown User"
      const embed = new EmbedBuilder()
        .setColor(ticketConfig.embed.log.color)
        .setTitle(`Ticket ${action === "created" ? "created" : action === "closed" ? "closed" : "deleted"}`)
        .addFields(
          { name: "Ticket ID", value: ticketData.channelId, inline: true },
          { name: "Ticket Type", value: ticketData.ticketType || "Standard", inline: true },
          { name: "Created by", value: `${creatorName} (${ticketData.userId})`, inline: true },
          { name: "Created at", value: `<t:${Math.floor(ticketData.createdAt / 1000)}:F>`, inline: true },
          { name: "Action performed by", value: `${actionUserName} (${userId})`, inline: true },
          { name: "Action performed at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
        )
      if (ticketData.subject) {
        embed.addFields({ name: "Subject", value: ticketData.subject })
      }
      if (ticketData.isGiveawayWinner) {
        embed.addFields({ name: "Prize", value: ticketData.prize || "Unknown" })
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
      await logChannel.send({ embeds: [embed] })
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
        .setTitle(`Prize: ${prize}`)
        .setDescription(
          `Congratulations <@${interaction.user.id}> on your prize!\nA team member will assist you with the delivery shortly.`,
        )
        .addFields({ name: "Winner", value: `<@${interaction.user.id}>` }, { name: "Prize", value: prize })
      if (description) {
        embed.addFields({ name: "Description", value: description })
      }
      if (giveawayId) {
        embed.addFields({ name: "Giveaway ID", value: giveawayId })
      }
      embed.addFields({ name: "Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>` })
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
        .setCustomId('ticket_type_general")_type_general')
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
    const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
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
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true })
      }
      const ticketTypeNames = {
        general: "General Support",
        technical: "Technical Support",
        custom: "Custom Support",
      }
      const typeName = ticketTypeNames[ticketType] || "Support"
      const existingTicket = await this.getUserTicket(interaction.user.id)
      if (existingTicket) {
        const reply = await interaction.editReply({
          content: `You already have an open ticket: <#${existingTicket.channelId}>`,
          components: [],
          embeds: [],
        })
        setTimeout(() => {
          reply.delete().catch((err) => console.error("Error deleting ticket message:", err))
        }, 5000)
        return
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
        .setTitle(`${typeName} Ticket`)
        .setDescription(`Hello <@${interaction.user.id}>,

Thank you for your request. A team member will assist you shortly.

In the meantime, please describe your issue in as much detail as possible so we can help you quickly.`)
        .addFields(
          { name: "Ticket Type", value: typeName, inline: true },
          { name: "Created by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Created at", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
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
      this.saveTicket(ticketChannel.id, ticketData)
      this.saveUserTicket(interaction.user.id, ticketData)
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
}
