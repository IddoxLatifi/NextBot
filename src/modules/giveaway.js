const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const ms = require("ms")
const giveawayConfig = require("../config/giveaway")
const fs = require("fs")
const path = require("path")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
const DATA_DIR = path.join(__dirname, "../../data")
const GIVEAWAYS_DIR = path.join(DATA_DIR, "giveaways")
const WINNER_CODES_DIR = path.join(DATA_DIR, "winner-codes")
const GIVEAWAY_CLAIMS_DIR = path.join(DATA_DIR, "giveaway-claims")
const CLAIMED_PRIZES_DIR = path.join(DATA_DIR, "claimed-prizes")
function ensureDirectoriesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(GIVEAWAYS_DIR)) {
    fs.mkdirSync(GIVEAWAYS_DIR, { recursive: true })
  }
  if (!fs.existsSync(WINNER_CODES_DIR)) {
    fs.mkdirSync(WINNER_CODES_DIR, { recursive: true })
  }
  if (!fs.existsSync(GIVEAWAY_CLAIMS_DIR)) {
    fs.mkdirSync(GIVEAWAY_CLAIMS_DIR, { recursive: true })
  }
  if (!fs.existsSync(CLAIMED_PRIZES_DIR)) {
    fs.mkdirSync(CLAIMED_PRIZES_DIR, { recursive: true })
  }
}
module.exports = {
  name: "giveaway",
  /**
   * @param {Client} client
   */
  init(client) {
    ensureDirectoriesExist()
    console.log("Giveaway module initialized")
    if (!client.giveaways) {
      client.giveaways = new Map()
    }
    setInterval(() => this.checkGiveawayIntegrity(client), 30 * 60 * 1000) 
  },
  /**
   * @param {Client} client
   */
  async loadActiveGiveaways(client) {
    try {
      ensureDirectoriesExist()
      const giveawayFiles = fs.readdirSync(GIVEAWAYS_DIR).filter((file) => file.endsWith(".json"))
      console.log(`Found ${giveawayFiles.length} active giveaways to load`)
      if (!client.giveaways) {
        client.giveaways = new Map()
      }
      for (const file of giveawayFiles) {
        try {
          const filePath = path.join(GIVEAWAYS_DIR, file)
          const fileContent = fs.readFileSync(filePath, "utf8")
          const giveawayData = JSON.parse(fileContent)
          if (giveawayData) {
            if (giveawayData.endsAt <= Date.now()) {
              console.log(
                `Giveaway ${giveawayData.messageId} (${giveawayData.prize}) has already ended, processing end...`,
              )
              setTimeout(() => this.endGiveaway(client, giveawayData.messageId), 5000)
            } else {
              const timeLeft = giveawayData.endsAt - Date.now()
              console.log(
                `Scheduling giveaway ${giveawayData.messageId} (${giveawayData.prize}) to end in ${Math.floor(timeLeft / 1000)} seconds`,
              )
              client.giveaways.set(giveawayData.messageId, giveawayData)
              this.scheduleGiveawayEnd(client, giveawayData.messageId, timeLeft)
              try {
                const channel = await client.channels.fetch(giveawayData.channelId).catch(() => null)
                if (channel) {
                  const message = await channel.messages.fetch(giveawayData.messageId).catch(() => null)
                  if (message) {
                    const embed = EmbedBuilder.from(message.embeds[0])
                    const fieldsIndex = embed.data.fields.findIndex((field) => field.name === "Ends")
                    if (fieldsIndex !== -1) {
                      embed.data.fields[fieldsIndex].value = `<t:${Math.floor(giveawayData.endsAt / 1000)}:R>`
                    }
                    await message.edit({ embeds: [embed] }).catch((err) => {
                      console.error(`Error updating giveaway message ${giveawayData.messageId}:`, err)
                    })
                    console.log(`Successfully updated giveaway message ${giveawayData.messageId}`)
                  } else {
                    console.log(`Giveaway message ${giveawayData.messageId} not found, but keeping data for tracking`)
                  }
                } else {
                  console.log(`Channel ${giveawayData.channelId} for giveaway ${giveawayData.messageId} not found`)
                }
              } catch (err) {
                console.error(`Error updating giveaway message ${giveawayData.messageId}:`, err)
              }
            }
          }
        } catch (err) {
          console.error(`Error loading giveaway file ${file}:`, err)
        }
      }
      const claimFiles = fs.readdirSync(GIVEAWAY_CLAIMS_DIR).filter((file) => file.endsWith(".json"))
      console.log(`Found ${claimFiles.length} pending giveaway claims`)
      for (const file of claimFiles) {
        try {
          const filePath = path.join(GIVEAWAY_CLAIMS_DIR, file)
          const fileContent = fs.readFileSync(filePath, "utf8")
          const claimData = JSON.parse(fileContent)

          if (claimData) {
            if (claimData.rerollAt > Date.now()) {
              const timeLeft = claimData.rerollAt - Date.now()
              this.scheduleClaimReroll(client, claimData.messageId, timeLeft)
              console.log(
                `Scheduled reroll for giveaway: ${claimData.prize} in ${Math.floor(timeLeft / 60000)} minutes`,
              )
            } else {
              console.log(`Performing immediate reroll for expired claim: ${claimData.prize}`)
              await this.performReroll(client, claimData.messageId)
              fs.unlinkSync(filePath)
            }
          }
        } catch (err) {
          console.error(`Error loading claim file ${file}:`, err)
        }
      }

      console.log(`Successfully loaded ${client.giveaways.size} active giveaways`)
      return true
    } catch (error) {
      console.error("Error loading giveaways:", error)
      return false
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   * @param {Object} options
   */
  async createGiveaway(interaction, client, options) {
    const {
      prize,
      duration,
      winners,
      description = "",
      imageUrl = null,
      bannerUrl = null,
      color = null,
      sponsor = null,
      sponsorWebsite = null,
    } = options
    const durationMs = ms(duration)
    if (!durationMs) {
      return interaction.reply({
        content: "Invalid duration. Examples: 1d, 12h, 30m",
        ephemeral: true,
      })
    }
    const endsAt = Date.now() + durationMs
    let sponsorInfo = ""
    if (sponsor) {
      sponsorInfo = `\n\n**Sponsor:** ${sponsor}`
      if (sponsorWebsite) {
        sponsorInfo += ` • [Website](${sponsorWebsite})`
      }
    }
    const embed = new EmbedBuilder()
      .setColor(color || giveawayConfig.embedColor)
      .setTitle(giveawayConfig.messages.giveaway)
      .setDescription(`**${prize}**\n\n${description}${sponsorInfo}`)
      .addFields(
        { name: "Ends", value: `<t:${Math.floor(endsAt / 1000)}:R>`, inline: true },
        { name: "Winners", value: `${winners}`, inline: true },
        { name: giveawayConfig.messages.hostedBy, value: `<@${interaction.user.id}>`, inline: true },
        { name: "Participants", value: "0", inline: true },
      )
    if (imageUrl) {
      embed.setThumbnail(imageUrl)
    }
    if (bannerUrl) {
      embed.setImage(bannerUrl)
    } else {
      embed.setImage(process.env.GIVEAWAY_IMAGE_URL || giveawayConfig.defaultImage)
    }
    if (giveawayConfig.embed.showTimestamp) {
      embed.setTimestamp()
    }
    if (giveawayConfig.embed.footer) {
      embed.setFooter({
        text: giveawayConfig.embed.footer,
        iconURL: giveawayConfig.embed.footerIconUrl,
      })
    }
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("giveaway_enter").setLabel("Enter").setStyle(ButtonStyle.Primary).setEmoji("🎉"),
    )
    let messageContent = ""
    if (sponsor) {
      messageContent = `🎉 **NEW GIVEAWAY** 🎉\nSponsored by ${sponsor}`
    }
    const message = await interaction.channel.send({
      content: messageContent,
      embeds: [embed],
      components: [button],
    })
    const giveawayData = {
      messageId: message.id,
      channelId: message.channel.id,
      guildId: message.guild.id,
      prize,
      description,
      winners: Number(winners),
      endsAt,
      hostId: interaction.user.id,
      participants: [],
      imageUrl,
      bannerUrl,
      color,
      sponsorId: sponsor ? sponsor.id : null,
      sponsorWebsite,
      createdAt: Date.now(), 
    }
    if (!client.giveaways) {
      client.giveaways = new Map()
    }
    client.giveaways.set(message.id, giveawayData)
    this.saveGiveaway(message.id, giveawayData)
    this.scheduleGiveawayEnd(client, message.id, durationMs)
    await interaction.reply({
      content: `Giveaway for **${prize}** started!`,
      ephemeral: true,
    })
  },
  /**
   * @param {string} messageId
   * @param {Object} giveawayData
   */
  saveGiveaway(messageId, giveawayData) {
    try {
      ensureDirectoriesExist()
      const filePath = path.join(GIVEAWAYS_DIR, `${messageId}.json`)
      fs.writeFileSync(filePath, JSON.stringify(giveawayData, null, 2))
      console.log(`Saved giveaway data for ${messageId} (${giveawayData.prize})`)
      if (!fs.existsSync(filePath)) {
        console.error(`Failed to save giveaway ${messageId}: File not found after write attempt`)
      }
    } catch (error) {
      console.error(`Error saving giveaway ${messageId}:`, error)
    }
  },
  /**
   * @param {string} messageId
   * @returns {Object|null}
   */
  getGiveaway(messageId) {
    try {
      const filePath = path.join(GIVEAWAYS_DIR, `${messageId}.json`)
      if (!fs.existsSync(filePath)) return null
      const fileContent = fs.readFileSync(filePath, "utf8")
      return JSON.parse(fileContent)
    } catch (error) {
      console.error(`Error getting giveaway ${messageId}:`, error)
      return null
    }
  },
  /**
   * @param {string} messageId
   */
  deleteGiveaway(messageId) {
    try {
      const filePath = path.join(GIVEAWAYS_DIR, `${messageId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`Error deleting giveaway ${messageId}:`, error)
    }
  },
  /**
   * @param {string} messageId
   * @param {Object} claimData
   */
  saveClaimData(messageId, claimData) {
    ensureDirectoriesExist()
    const filePath = path.join(GIVEAWAY_CLAIMS_DIR, `${messageId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(claimData, null, 2))
  },
  /**
   * @param {string} messageId
   * @returns {Object|null}
   */
  getClaimData(messageId) {
    try {
      const filePath = path.join(GIVEAWAY_CLAIMS_DIR, `${messageId}.json`)
      if (!fs.existsSync(filePath)) return null
      const fileContent = fs.readFileSync(filePath, "utf8")
      return JSON.parse(fileContent)
    } catch (error) {
      console.error(`Error getting claim data ${messageId}:`, error)
      return null
    }
  },
  /**
   * @param {string} messageId
   */
  deleteClaimData(messageId) {
    try {
      const filePath = path.join(GIVEAWAY_CLAIMS_DIR, `${messageId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.error(`Error deleting claim data ${messageId}:`, error)
    }
  },
  /**
   * @param {string} userId
   * @param {string} giveawayId
   * @param {string} prize
   */
  markPrizeAsClaimed(userId, giveawayId, prize) {
    ensureDirectoriesExist()
    const claimData = {
      userId,
      giveawayId,
      prize,
      claimedAt: Date.now(),
    }
    const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
    const filePath = path.join(CLAIMED_PRIZES_DIR, `${userId}_${giveawayId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(claimData, null, 2))
    this.checkAllWinnersClaimed(giveawayId)
  },
  /**
   * @param {string} userId
   * @param {string} giveawayId
   * @returns {boolean}
   */
  hasPrizeClaimed(userId, giveawayId) {
    try {
      const filePath = path.join(CLAIMED_PRIZES_DIR, `${userId}_${giveawayId}.json`)
      return fs.existsSync(filePath)
    } catch (error) {
      console.error(`Error checking if prize is claimed for user ${userId} and giveaway ${giveawayId}:`, error)
      return false
    }
  },
  /**
   * @param {string} giveawayId
   * @returns {boolean}
   */
  checkAllWinnersClaimed(giveawayId) {
    try {
      const claimData = this.getClaimData(giveawayId)
      if (!claimData) return false
      const allClaimed = claimData.winners.every((winnerId) => this.hasPrizeClaimed(winnerId, giveawayId))
      if (allClaimed) {
        console.log(`All winners have claimed their prizes for giveaway ${giveawayId}. Removing claim data.`)
        this.deleteClaimData(giveawayId)
      }
      return allClaimed
    } catch (error) {
      console.error(`Error checking if all winners claimed for giveaway ${giveawayId}:`, error)
      return false
    }
  },
  /**
   * @param {Client} client
   * @param {string} messageId
   * @param {number} duration
   */
  scheduleGiveawayEnd(client, messageId, duration) {
    setTimeout(async () => {
      await this.endGiveaway(client, messageId)
    }, duration)
  },
  /**
   * @param {Client} client
   * @param {string} messageId
   * @param {number} duration
   */
  scheduleClaimReroll(client, messageId, duration) {
    setTimeout(async () => {
      const allClaimed = this.checkAllWinnersClaimed(messageId)
      if (!allClaimed) {
        await this.performReroll(client, messageId)
      } else {
        console.log(`All winners have claimed their prizes for giveaway ${messageId}. No reroll needed.`)
      }
    }, duration)
  },
  /**
   * @param {Client} client
   * @param {string} userId
   * @param {string} prize
   * @param {string} giveawayId
   * @returns {string}
   */
  async generateWinnerCode(client, userId, prize, giveawayId) {
    try {
      ensureDirectoriesExist()
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      let expiresAt = null
      if (giveawayConfig.claimPeriod > 0) {
        expiresAt = Date.now() + giveawayConfig.claimPeriod * 60 * 1000
      }
      const codeData = {
        code,
        userId,
        prize,
        giveawayId,
        expiresAt,
      }
      const filePath = path.join(WINNER_CODES_DIR, `${userId}.json`)
      fs.writeFileSync(filePath, JSON.stringify(codeData, null, 2))
      return code
    } catch (error) {
      console.error("Error generating winner code:", error)
      return null
    }
  },
  /**
   * @param {Client} client
   * @param {string} userId
   * @param {string} code
   * @returns {Object}
   */
  async validateWinnerCode(client, userId, code) {
    try {
      const filePath = path.join(WINNER_CODES_DIR, `${userId}.json`)
      if (!fs.existsSync(filePath)) {
        return { valid: false, message: "You don't have an active prize code." }
      }
      const fileContent = fs.readFileSync(filePath, "utf8")
      const winnerCode = JSON.parse(fileContent)
      if (winnerCode.code !== code) {
        return { valid: false, message: "The code you entered is invalid." }
      }
      if (winnerCode.expiresAt && winnerCode.expiresAt < Date.now()) {
        fs.unlinkSync(filePath)
        return { valid: false, message: "Your prize code has expired." }
      }
      fs.unlinkSync(filePath)
      this.markPrizeAsClaimed(userId, winnerCode.giveawayId, winnerCode.prize)
      return {
        valid: true,
        prize: winnerCode.prize,
        giveawayId: winnerCode.giveawayId,
      }
    } catch (error) {
      console.error("Error validating winner code:", error)
      return { valid: false, message: "An error occurred while verifying the code." }
    }
  },
  /**
   * @param {Client} client
   * @param {string} messageId
   */
  async endGiveaway(client, messageId) {
    try {
      const giveawayData = client.giveaways.get(messageId) || this.getGiveaway(messageId)
      if (!giveawayData) {
        console.error(`Giveaway ${messageId} not found`)
        return
      }
      const channel = await client.channels.fetch(giveawayData.channelId).catch(() => null)
      if (!channel) {
        console.error(`Channel ${giveawayData.channelId} not found`)
        return
      }
      const message = await channel.messages.fetch(messageId).catch(() => null)
      if (!message) {
        console.error(`Message ${messageId} not found`)
        return
      }
      const winners = await this.selectWinners(
        client,
        giveawayData.guildId,
        giveawayData.participants,
        giveawayData.winners,
      )
      const embed = EmbedBuilder.from(message.embeds[0])
        .setColor(winners.length > 0 ? giveawayData.color || giveawayConfig.embedColor : "#F04747")
        .setTitle(giveawayConfig.messages.giveawayEnded)
      if (winners.length > 0) {
        const winnerMentions = winners.map((id) => `<@${id}>`).join(", ")
        embed.addFields({ name: giveawayConfig.messages.winners, value: winnerMentions })
      } else {
        embed.addFields({ name: giveawayConfig.messages.winners, value: giveawayConfig.messages.noWinner })
      }
      await message.edit({
        embeds: [embed],
        components: [],
      })
      if (winners.length > 0) {
        const ticketChannelId = process.env.TICKET_CHANNEL_ID || giveawayConfig.winnerTicketChannelId
        let ticketChannel = null
        if (ticketChannelId) {
          ticketChannel = await client.channels.fetch(ticketChannelId).catch(() => null)
        }
        for (const winnerId of winners) {
          try {
            const code = await this.generateWinnerCode(client, winnerId, giveawayData.prize, messageId)
            const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
            const user = await client.users.fetch(winnerId).catch(() => null)
            if (!user) continue
            const dmEmbed = new EmbedBuilder()
              .setColor(giveawayData.color || giveawayConfig.embedColor)
              .setTitle("🎉 You've won! 🎉")
              .setDescription(`Congratulations! You've won **${giveawayData.prize}**!`)
            dmEmbed.addFields({ name: "Your Verification Code", value: `\`${code}\`` })
            let instructionText =
              "To claim your prize, click the 'Claim Prize' button in the giveaway channel and enter this code."
            if (ticketChannel) {
              instructionText = `To claim your prize, [click here](https://discord.com/channels/${giveawayData.guildId}/${ticketChannelId}) or go to the <#${ticketChannelId}> channel and click the 'Claim Prize' button. Then enter your verification code.`
            }
            dmEmbed.addFields({ name: "Instructions", value: instructionText })
            let expiryText = "Keep this code safe and don't share it with anyone."
            if (giveawayConfig.claimPeriod > 0) {
              const timeUnit =
                giveawayConfig.claimPeriod >= 60
                  ? `${Math.floor(giveawayConfig.claimPeriod / 60)} hours`
                  : `${giveawayConfig.claimPeriod} minutes`
              expiryText = `This code is valid for ${timeUnit}. Keep it safe and don't share it with anyone.`
            }
            dmEmbed.addFields({ name: "Note", value: expiryText }).setTimestamp()
            if (giveawayData.imageUrl) {
              dmEmbed.setThumbnail(giveawayData.imageUrl)
            }
            await user.send({ embeds: [dmEmbed] }).catch((err) => {
              console.error(`Could not send DM to winner ${winnerId}:`, err)
            })
          } catch (error) {
            console.error(`Error sending code to winner ${winnerId}:`, error)
          }
        }
        const announcementEmbed = new EmbedBuilder()
          .setColor(giveawayData.color || giveawayConfig.embedColor)
          .setTitle("🎉 Giveaway Winners 🎉")
          .setDescription(`Congratulations! You've won **${giveawayData.prize}**!`)
          .setTimestamp()
        if (giveawayData.sponsorId) {
          announcementEmbed.addFields({
            name: "Sponsor",
            value:
              `<@${giveawayData.sponsorId}>` +
              (giveawayData.sponsorWebsite ? ` • [Website](${giveawayData.sponsorWebsite})` : ""),
          })
        }
        if (giveawayData.imageUrl) {
          announcementEmbed.setThumbnail(giveawayData.imageUrl)
        }
        if (giveawayData.bannerUrl) {
          announcementEmbed.setImage(giveawayData.bannerUrl)
        }
        if (giveawayConfig.embed.footer) {
          announcementEmbed.setFooter({
            text: giveawayConfig.embed.footer,
            iconURL: giveawayConfig.embed.footerIconUrl,
          })
        }
        let claimInstructions =
          "All winners have received a verification code via DM. Click the button below to create a ticket and enter your code to claim your prize."
        if (ticketChannel) {
          claimInstructions = `All winners have received a verification code via DM. Click the button below or go to the <#${ticketChannelId}> channel to claim your prize.`
        }
        announcementEmbed.addFields({
          name: "Claim Prize",
          value: claimInstructions,
        })
        const uniqueMentions = [...new Set([...winners, giveawayData.sponsorId].filter(Boolean))]
        const winnerMentions = winners.map((id) => `<@${id}>`).join(" ")
        const claimButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("giveaway_claim")
            .setLabel("Claim Prize")
            .setStyle(ButtonStyle.Success)
            .setEmoji("🎁"),
        )
        await channel.send({
          content: `🎉 **GIVEAWAY WINNERS ANNOUNCED** 🎉\n${winnerMentions}, you've won **${giveawayData.prize}**!\nCheck your DMs for your verification code!`,
          embeds: [announcementEmbed],
          components: [claimButton],
          allowedMentions: { users: uniqueMentions },
        })
        if ((ticketChannelId || giveawayConfig.winnerTicketChannelId) && giveawayConfig.claimPeriod > 0) {
          const rerollAt = Date.now() + giveawayConfig.claimPeriod * 60 * 1000
          const claimData = {
            messageId,
            channelId: channel.id,
            guildId: channel.guild.id,
            prize: giveawayData.prize,
            winners,
            participants: giveawayData.participants,
            winnerCount: giveawayData.winners,
            rerollAt,
            color: giveawayData.color,
            sponsorId: giveawayData.sponsorId,
            sponsorWebsite: giveawayData.sponsorWebsite,
            imageUrl: giveawayData.imageUrl,
            bannerUrl: giveawayData.bannerUrl,
          }
          this.saveClaimData(messageId, claimData)
          this.scheduleClaimReroll(client, messageId, rerollAt - Date.now())
        }
      } else {
        await channel.send({
          content: `No one participated in the giveaway for **${giveawayData.prize}** 😢`,
        })
      }
      client.giveaways.delete(messageId)
      this.deleteGiveaway(messageId)
    } catch (error) {
      console.error("Error ending giveaway:", error)
    }
  },
  /**
   * @param {Client} client
   * @param {string} messageId
   */
  async performReroll(client, messageId) {
    try {
      const claimData = this.getClaimData(messageId)
      if (!claimData) {
        console.error(`Claim data for giveaway ${messageId} not found`)
        return
      }
      const channel = await client.channels.fetch(claimData.channelId).catch(() => null)
      if (!channel) {
        console.error(`Channel ${claimData.channelId} not found`)
        return
      }
      const unclaimedWinners = claimData.winners.filter((winnerId) => !this.hasPrizeClaimed(winnerId, messageId))
      if (unclaimedWinners.length === 0) {
        console.log(`All winners have claimed their prizes for giveaway ${messageId}. No reroll needed.`)
        this.deleteClaimData(messageId)
        return
      }
      const rerollMessage = `${unclaimedWinners.length} ${unclaimedWinners.length === 1 ? "winner has" : "winners have"} not claimed ${unclaimedWinners.length === 1 ? "their prize" : "their prizes"} within ${giveawayConfig.claimPeriod} minutes. ${unclaimedWinners.length === 1 ? "A new winner will" : "New winners will"} be selected.`
      const newWinners = await this.selectWinners(
        client,
        claimData.guildId,
        claimData.participants.filter((id) => !claimData.winners.includes(id)),
        unclaimedWinners.length,
      )

      if (newWinners.length === 0) {
        await channel.send({
          content: `${rerollMessage}\nUnfortunately, there are no more participants for **${claimData.prize}**.`,
        })
        this.deleteClaimData(messageId)
        return
      }
      const ticketChannelId = process.env.TICKET_CHANNEL_ID || giveawayConfig.winnerTicketChannelId
      let ticketChannel = null
      if (ticketChannelId) {
        ticketChannel = await client.channels.fetch(ticketChannelId).catch(() => null)
      }
      for (const winnerId of newWinners) {
        try {
          const code = await this.generateWinnerCode(client, winnerId, claimData.prize, messageId)
          const user = await client.users.fetch(winnerId).catch(() => null)
          if (!user) continue
          const dmEmbed = new EmbedBuilder()
            .setColor(claimData.color || giveawayConfig.embedColor)
            .setTitle("🎉 You've won! 🎉")
            .setDescription(`Congratulations! You've won **${claimData.prize}** in the reroll!`)
          dmEmbed.addFields({ name: "Your Verification Code", value: `\`${code}\`` })
          let instructionText =
            "To claim your prize, click the 'Claim Prize' button in the giveaway channel and enter this code."
          if (ticketChannel) {
            instructionText = `To claim your prize, [click here](https://discord.com/channels/${claimData.guildId}/${ticketChannelId}) or go to the <#${ticketChannelId}> channel and click the 'Claim Prize' button. Then enter your verification code.`
          }

          dmEmbed.addFields({ name: "Instructions", value: instructionText })
          let expiryText = "Keep this code safe and don't share it with anyone."
          if (giveawayConfig.claimPeriod > 0) {
            const timeUnit =
              giveawayConfig.claimPeriod >= 60
                ? `${Math.floor(giveawayConfig.claimPeriod / 60)} hours`
                : `${giveawayConfig.claimPeriod} minutes`
            expiryText = `This code is valid for ${timeUnit}. Keep it safe and don't share it with anyone.`
          }
          dmEmbed.addFields({ name: "Note", value: expiryText }).setTimestamp()
          if (claimData.imageUrl) {
            dmEmbed.setThumbnail(claimData.imageUrl)
          }
          await user.send({ embeds: [dmEmbed] }).catch((err) => {
            console.error(`Could not send DM to winner ${winnerId}:`, err)
          })
        } catch (error) {
          console.error(`Error sending code to winner ${winnerId}:`, error)
        }
      }
      const embed = new EmbedBuilder()
        .setColor(claimData.color || giveawayConfig.embedColor)
        .setTitle("🎉 Giveaway Reroll 🎉")
        .setDescription(`**${claimData.prize}**\n\n${rerollMessage}`)
        .addFields({ name: "New Winners", value: newWinners.map((id) => `<@${id}>`).join(", ") })
        .setTimestamp()
      if (giveawayConfig.embed.footer) {
        embed.setFooter({
          text: giveawayConfig.embed.footer,
          iconURL: giveawayConfig.embed.footerIconUrl,
        })
      }
      let claimInstructions =
        "All winners have received a verification code via DM. Click the button below to create a ticket and enter your code to claim your prize."
      if (ticketChannel) {
        claimInstructions = `All winners have received a verification code via DM. Click the button below or go to the <#${ticketChannelId}> channel to claim your prize.`
      }
      embed.addFields({
        name: "Claim Prize",
        value: claimInstructions,
      })
      const winnerMentions = newWinners.map((id) => `<@${id}>`).join(" ")
      const claimButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("giveaway_claim")
          .setLabel("Claim Prize")
          .setStyle(ButtonStyle.Success)
          .setEmoji("🎁"),
      )
      await channel.send({
        content: `🎉 **GIVEAWAY REROLL** 🎉\n${winnerMentions}, you've won **${claimData.prize}**!\nCheck your DMs for your verification code!`,
        embeds: [embed],
        components: [claimButton],
        allowedMentions: { users: newWinners },
      })
      if (giveawayConfig.claimPeriod > 0) {
        const rerollAt = Date.now() + giveawayConfig.claimPeriod * 60 * 1000
        const newClaimData = {
          ...claimData,
          winners: newWinners,
          rerollAt,
        }
        this.saveClaimData(messageId, newClaimData)
        this.scheduleClaimReroll(client, messageId, rerollAt - Date.now())
      } else {
        this.deleteClaimData(messageId)
      }
    } catch (error) {
      console.error("Error performing reroll:", error)
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleButtonInteraction(interaction, client) {
    console.log(`Giveaway button interaction received: ${interaction.customId}`)
    if (interaction.customId === "giveaway_enter") {
      await this.handleGiveawayEnter(interaction, client)
    } else if (interaction.customId === "giveaway_claim") {
      console.log("Claim button clicked by:", interaction.user.tag)
      const ticketModule = require("./ticket")
      await ticketModule.showGiveawayClaimModal(interaction)
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleGiveawayEnter(interaction, client) {
    try {
      const messageId = interaction.message.id
      console.log(`User ${interaction.user.tag} attempting to enter giveaway ${messageId}`)
      let giveawayData = client.giveaways.get(messageId)
      if (!giveawayData) {
        console.log(`Giveaway ${messageId} not found in memory, attempting to load from file`)
        giveawayData = this.getGiveaway(messageId)
        if (!giveawayData) {
          console.error(`Giveaway ${messageId} not found in file system either`)
          return interaction.reply({
            content: "This giveaway no longer exists or has already ended.",
            ephemeral: true,
          })
        }
        client.giveaways.set(messageId, giveawayData)
        console.log(`Restored giveaway ${messageId} from file to memory`)
      }
      if (giveawayData.endsAt < Date.now()) {
        return interaction.reply({
          content: "This giveaway has already ended.",
          ephemeral: true,
        })
      }
      const userId = interaction.user.id
      if (giveawayData.participants.includes(userId)) {
        giveawayData.participants = giveawayData.participants.filter((id) => id !== userId)
        await interaction.reply({
          content: "You are no longer participating in the giveaway.",
          ephemeral: true,
        })
      } else {
        giveawayData.participants.push(userId)
        await interaction.reply({
          content: "You are now participating in the giveaway! Good luck!",
          ephemeral: true,
        })
      }
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
      const fields = embed.data.fields
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].name === "Participants") {
          fields[i].value = giveawayData.participants.length.toString()
          break
        }
      }
      await interaction.message.edit({
        embeds: [embed],
      })
      client.giveaways.set(messageId, giveawayData)
      this.saveGiveaway(messageId, giveawayData)
    } catch (error) {
      console.error("Error handling giveaway entry:", error)
      await interaction.reply({
        content: "An error occurred while processing your entry. Please try again later.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {Client} client
   * @param {string} guildId
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getParticipantWeight(client, guildId, userId) {
    if (!giveawayConfig.boostedChances || !giveawayConfig.boostedChances.enabled) {
      return 1
    }
    try {
      let weight = 1
      if (giveawayConfig.boostedChances.users && giveawayConfig.boostedChances.users[userId]) {
        const userBoost = giveawayConfig.boostedChances.users[userId]
        weight += userBoost / 100 
        if (userBoost >= 100) {
          return Number.MAX_SAFE_INTEGER
        }
      }
      if (giveawayConfig.boostedChances.roles) {
        try {
          const guild = await client.guilds.fetch(guildId)
          const member = await guild.members.fetch(userId)
          for (const [roleId, boostPercent] of Object.entries(giveawayConfig.boostedChances.roles)) {
            if (member.roles.cache.has(roleId)) {
              weight += boostPercent / 100
              if (boostPercent >= 100) {
                return Number.MAX_SAFE_INTEGER
              }
            }
          }
        } catch (err) {
          console.error(`Error fetching member roles for boosted chances: ${err}`)
        }
      }
      return weight
    } catch (error) {
      console.error(`Error calculating participant weight: ${error}`)
      return 1 
    }
  },
  /**
   * @param {Client} client
   * @param {string} guildId
   * @param {Array<string>} participants
   * @param {number} winnerCount
   * @returns {Promise<Array<string>>}
   */
  async selectWinners(client, guildId, participants, winnerCount) {
    if (!participants || participants.length === 0) {
      return []
    }
    if (!giveawayConfig.boostedChances || !giveawayConfig.boostedChances.enabled) {
      const shuffled = [...participants].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, Math.min(winnerCount, shuffled.length))
    }
    try {
      const winners = []
      const remainingParticipants = [...participants]
      if (giveawayConfig.boostedChances.users) {
        for (const userId of remainingParticipants) {
          const userBoost = giveawayConfig.boostedChances.users[userId]
          if (userBoost && userBoost >= 100) {
            winners.push(userId)
            const index = remainingParticipants.indexOf(userId)
            if (index !== -1) remainingParticipants.splice(index, 1)
            if (winners.length >= winnerCount) {
              return winners
            }
          }
        }
      }
      if (giveawayConfig.boostedChances.roles && Object.keys(giveawayConfig.boostedChances.roles).length > 0) {
        try {
          const guild = await client.guilds.fetch(guildId)

          for (const userId of [...remainingParticipants]) {
            try {
              const member = await guild.members.fetch(userId)
              let hasGuaranteedWin = false
              for (const [roleId, boostPercent] of Object.entries(giveawayConfig.boostedChances.roles)) {
                if (boostPercent >= 100 && member.roles.cache.has(roleId)) {
                  hasGuaranteedWin = true
                  break
                }
              }
              if (hasGuaranteedWin) {
                winners.push(userId)
                const index = remainingParticipants.indexOf(userId)
                if (index !== -1) remainingParticipants.splice(index, 1)
                if (winners.length >= winnerCount) {
                  return winners
                }
              }
            } catch (err) {
              console.error(`Error checking roles for user ${userId}: ${err}`)
            }
          }
        } catch (err) {
          console.error(`Error fetching guild for role checks: ${err}`)
        }
      }
      if (winners.length < winnerCount && remainingParticipants.length > 0) {
        const weights = []
        for (const userId of remainingParticipants) {
          const weight = await this.getParticipantWeight(client, guildId, userId)
          weights.push({ userId, weight })
        }
        while (winners.length < winnerCount && weights.length > 0) {
          const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0)
          const random = Math.random() * totalWeight
          let cumulativeWeight = 0
          for (let i = 0; i < weights.length; i++) {
            cumulativeWeight += weights[i].weight
            if (random <= cumulativeWeight) {
              winners.push(weights[i].userId)
              weights.splice(i, 1) 
              break
            }
          }
        }
      }
      return winners
    } catch (error) {
      console.error(`Error selecting winners with boosted chances: ${error}`)
      const shuffled = [...participants].sort(() => 0.5 - Math.random())
      return shuffled.slice(0, Math.min(winnerCount, shuffled.length))
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleModalSubmit(interaction, client) {
    console.log(`Giveaway modal submit received: ${interaction.customId}`)
    if (interaction.customId === "ticket_modal_claim_giveaway") {
      const code = interaction.fields.getTextInputValue("ticket_code")
      const description = interaction.fields.getTextInputValue("ticket_description") || ""
      const validation = await this.validateWinnerCode(client, interaction.user.id, code)
      if (!validation.valid) {
        return interaction.reply({
          content: validation.message,
          ephemeral: true,
        })
      }
      const ticketModule = require("./ticket")
      await ticketModule.createWinnerTicket(interaction, client, validation.prize, description, validation.giveawayId)
    }
  },
  /**
   * @param {Client} client
   */
  async checkGiveawayIntegrity(client) {
    try {
      console.log("Checking giveaway data integrity...")
      const giveawayFiles = fs.readdirSync(GIVEAWAYS_DIR).filter((file) => file.endsWith(".json"))
      for (const file of giveawayFiles) {
        try {
          const messageId = file.replace(".json", "")
          const filePath = path.join(GIVEAWAYS_DIR, file)
          const fileContent = fs.readFileSync(filePath, "utf8")
          const giveawayData = JSON.parse(fileContent)
          if (!client.giveaways.has(messageId)) {
            console.log(`Giveaway ${messageId} found in file but not in memory, restoring...`)
            client.giveaways.set(messageId, giveawayData)
          }
          if (giveawayData.endsAt < Date.now()) {
            console.log(`Giveaway ${messageId} has ended but file still exists, cleaning up...`)
            this.deleteGiveaway(messageId)
          }
        } catch (err) {
          console.error(`Error checking giveaway file ${file}:`, err)
        }
      }
      for (const [messageId, giveawayData] of client.giveaways.entries()) {
        const filePath = path.join(GIVEAWAYS_DIR, `${messageId}.json`)
        if (!fs.existsSync(filePath)) {
          console.log(`Giveaway ${messageId} found in memory but not in file, saving...`)
          this.saveGiveaway(messageId, giveawayData)
        }
      }
      console.log("Giveaway integrity check complete")
    } catch (error) {
      console.error("Error checking giveaway integrity:", error)
    }
  },
}
