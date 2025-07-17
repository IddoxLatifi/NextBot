const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js")
const starboardConfig = require("../config/starboard")
const FileStorage = require("../utils/fileStorage")
const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
module.exports = {
  name: "starboard",
  /**
   * @param {Client} client
   */
  init(client) {
    console.log("Rating System initialized")
    if (!client.ratings) {
      client.ratings = new Map()
    }
    this.loadRatingsFromFile(client)
    if (!starboardConfig.channelId) {
      console.warn("Rating channel is not set! Please use /ratingset to set a channel.")
      client.once("ready", async () => {
        try {
          const guild = client.guilds.cache.first()
          if (guild) {
            const systemChannel = guild.systemChannel
            const owner = await guild.fetchOwner()
            if (systemChannel) {
              await systemChannel.send({
                content:
                  "⚠️ **Warning:** The rating channel is not set! Please use `/ratingset` to set a channel.",
              })
            } else {
              await owner
                .send({
                  content:
                    "⚠️ **Warning:** The rating channel for your server is not set! Please use `/ratingset` to set a channel.",
                })
                .catch(() => console.log("Could not DM server owner"))
            }
          }
        } catch (error) {
          console.error("Error sending channel not set warning:", error)
        }
      })
    }
    client.once("ready", async () => {
      await this.checkAndRecreateRatingEmbed(client)
    })
  },
  /**
   * @param {Client} client
   */
  async checkAndRecreateRatingEmbed(client) {
    try {
      console.log("Checking for existing rating embed...")
      const channel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
      if (!channel) {
        console.error(`Rating channel ${starboardConfig.channelId} not found`)
        return
      }
      await this.createRatingEmbed(client)
    } catch (error) {
      console.error("Error checking and recreating rating embed:", error)
    }
  },
  /**
   * @param {Client} client
   */
  async loadRatingsFromFile(client) {
    try {
      const defaultRatingsData = {
        totalRating: 0,
        ratingCount: 0,
        ratings: {},
        comments: [],
      }
      const ratingsData = await FileStorage.loadData("server_ratings", defaultRatingsData)
      client.ratings.set("server_rating", ratingsData)
      console.log("Loaded ratings from file:", ratingsData)
      console.log(
        `Average rating: ${ratingsData.ratingCount > 0 ? ratingsData.totalRating / ratingsData.ratingCount : 0}`,
      )
    } catch (error) {
      console.error("Error loading ratings from file:", error)
    }
  },
  /**
   * @param {Client} client
   */
  async saveRatingsToFile(client) {
    try {
      const ratingsData = client.ratings.get("server_rating")
      if (ratingsData) {
        await FileStorage.saveData("server_ratings", ratingsData)
        console.log("Saved ratings to file")
      }
    } catch (error) {
      console.error("Error saving ratings to file:", error)
    }
  },
  /**
   * @param {Client} client
   */
  async createRatingEmbed(client) {
    try {
      const channel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
      if (!channel) {
        console.error(`Rating channel ${starboardConfig.channelId} not found`)
        return
      }
      let message = null
      const savedEmbedData = await FileStorage.loadData("rating_embed_id", { id: null })
      if (savedEmbedData.id) {
        message = await channel.messages.fetch(savedEmbedData.id).catch(() => null)
      }
      if (!message) {
        const messages = await channel.messages.fetch({ limit: 50 })
        message = messages.find(
          (msg) =>
            msg.author.id === client.user.id &&
            msg.embeds.length > 0 &&
            msg.embeds[0].title === starboardConfig.embed.title,
        )
      }
      const embed = new EmbedBuilder()
        .setTitle(starboardConfig.embed.title)
        .setDescription(starboardConfig.embed.description)
        .setColor(starboardConfig.embed.color)
      if (starboardConfig.embed.showTimestamp) {
        embed.setTimestamp()
      }
      if (starboardConfig.embed.footer) {
        embed.setFooter({
          text: starboardConfig.embed.footer,
          iconURL: starboardConfig.embed.footerIconUrl,
        })
      }
      if (starboardConfig.embed.thumbnailUrl) {
        embed.setThumbnail(starboardConfig.embed.thumbnailUrl)
      }
      const ratingRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rating_1").setLabel("⭐").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rating_2").setLabel("⭐⭐").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rating_3").setLabel("⭐⭐⭐").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rating_4").setLabel("⭐⭐⭐⭐").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("rating_5").setLabel("⭐⭐⭐⭐⭐").setStyle(ButtonStyle.Secondary),
      )
      if (message) {
        // Nachricht aktualisieren
        await message.edit({ embeds: [embed], components: [ratingRow] })
        client.ratingEmbedId = message.id
        await FileStorage.saveData("rating_embed_id", { id: message.id })
        console.log(`Rating embed updated with ID: ${message.id}`)
      } else {
        // Neue Nachricht senden
        message = await channel.send({ embeds: [embed], components: [ratingRow] })
        client.ratingEmbedId = message.id
        await FileStorage.saveData("rating_embed_id", { id: message.id })
        console.log(`Rating embed created with ID: ${message.id}`)
      }
      let ratingsData = client.ratings.get("server_rating")
      if (!ratingsData) {
        ratingsData = {
          totalRating: 0,
          ratingCount: 0,
          ratings: {},
          comments: [],
        }
        client.ratings.set("server_rating", ratingsData)
      }
      if (ratingsData.ratingCount > 0) {
        const averageRating = ratingsData.totalRating / ratingsData.ratingCount
        await this.updateRatingEmbed(client, averageRating, ratingsData.ratingCount)
      }
      return message
    } catch (error) {
      console.error("Error creating rating embed:", error)
    }
  },
  /**
   * @param {MessageReaction} reaction
   * @param {User} user
   * @param {Client} client
   */
  async handleReactionAdd(reaction, user, client) {
    if (user.bot) return
    if (reaction.emoji.name !== "⭐") return
    const message = reaction.message
    if (message.author.bot) return
    if (message.channel.id === starboardConfig.channelId) return
    const starCount = reaction.count
    if (starCount < starboardConfig.minStars) return
    const existingStarboardMessage = client.starboardMessages?.get(message.id)
    if (existingStarboardMessage) {
      await this.updateStarboardMessage(client, message, starCount, existingStarboardMessage)
    } else {
      await this.createStarboardMessage(client, message, starCount)
    }
  },
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {number} starCount
   */
  async createStarboardMessage(client, message, starCount) {
    try {
      const starboardChannel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
      if (!starboardChannel) {
        console.error(`Starboard channel ${starboardConfig.channelId} not found`)
        return
      }
      const embed = new EmbedBuilder()
        .setColor(starboardConfig.embedColor)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(message.content || "")
        .addFields({ name: "Original", value: `[Zur Nachricht springen](${message.url})` })
        .setFooter({
          text: `⭐ ${starCount} | ${message.id}`,
        })
      if (starboardConfig.embed.showTimestamp) {
        embed.setTimestamp(message.createdAt)
      }
      if (message.attachments.size > 0) {
        const attachment = message.attachments.first()
        if (attachment.contentType && attachment.contentType.startsWith("image/")) {
          embed.setImage(attachment.url)
        }
      }
      const ratingRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`starboard_rate_1_${message.id}`)
          .setLabel("⭐")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`starboard_rate_2_${message.id}`)
          .setLabel("⭐⭐")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`starboard_rate_3_${message.id}`)
          .setLabel("⭐⭐⭐")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`starboard_rate_4_${message.id}`)
          .setLabel("⭐⭐⭐⭐")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`starboard_rate_5_${message.id}`)
          .setLabel("⭐⭐⭐⭐⭐")
          .setStyle(ButtonStyle.Secondary),
      )
      const starboardMessage = await starboardChannel.send({
        content: `⭐ **${starCount}** | ${message.channel}`,
        embeds: [embed],
        components: [ratingRow],
      })
      if (!client.starboardMessages) {
        client.starboardMessages = new Map()
      }
      client.starboardMessages.set(message.id, {
        starboardMessageId: starboardMessage.id,
        starCount,
      })
      await FileStorage.saveData(`starboard_${message.id}`, {
        starboardMessageId: starboardMessage.id,
        starCount,
        channelId: message.channel.id,
        guildId: message.guild.id,
      })
      if (!client.starboardRatings) {
        client.starboardRatings = new Map()
      }
      client.starboardRatings.set(message.id, {
        totalRating: starCount,
        ratingCount: starCount,
        ratings: {},
        comments: [],
      })
      await FileStorage.saveData(`starboard_ratings_${message.id}`, client.starboardRatings.get(message.id))
    } catch (error) {
      console.error("Error creating starboard message:", error)
    }
  },
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {number} starCount
   * @param {Object} existingData
   */
  async updateStarboardMessage(client, message, starCount, existingData) {
    try {
      const starboardChannel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
      if (!starboardChannel) {
        console.error(`Starboard channel ${starboardConfig.channelId} not found`)
        return
      }
      const starboardMessage = await starboardChannel.messages.fetch(existingData.starboardMessageId).catch(() => null)
      if (!starboardMessage) {
        console.error(`Starboard message ${existingData.starboardMessageId} not found`)
        return
      }
      const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
      const embed = EmbedBuilder.from(starboardMessage.embeds[0]).setFooter({
        text: `⭐ ${starCount} | ${message.id}`,
      })
      let ratingsData = client.starboardRatings?.get(message.id)
      if (!ratingsData) {
        ratingsData = {
          totalRating: starCount,
          ratingCount: starCount,
          ratings: {},
          comments: [],
        }
        if (!client.starboardRatings) {
          client.starboardRatings = new Map()
        }
        client.starboardRatings.set(message.id, ratingsData)
      } else {
        ratingsData.totalRating = starCount
        ratingsData.ratingCount = starCount
      }
      if (ratingsData.comments && ratingsData.comments.length > 0) {
        const fields = embed.data.fields.filter((field) => field.name !== "Kommentare")
        embed.data.fields = fields
        const commentsText = ratingsData.comments
          .map((comment) => `**${comment.username}**: ${comment.text}`)
          .join("\n\n")
          .substring(0, 1024)
        embed.addFields({ name: "Kommentare", value: commentsText })
      }
      await starboardMessage.edit({
        content: `⭐ **${starCount}** | ${message.channel}`,
        embeds: [embed],
      })
      existingData.starCount = starCount
      await FileStorage.saveData(`starboard_${message.id}`, {
        starboardMessageId: existingData.starboardMessageId,
        starCount,
        channelId: message.channel.id,
        guildId: message.guild.id,
      })
      await FileStorage.saveData(`starboard_ratings_${message.id}`, ratingsData)
    } catch (error) {
      console.error("Error updating starboard message:", error)
    }
  },
  /**
   * @param {Message} message
   * @param {Client} client
   */
  async handleMessage(message, client) {
    if (starboardConfig.autoStarChannels && starboardConfig.autoStarChannels.includes(message.channel.id)) {
      try {
        await message.react("⭐")
        console.log(`Auto-starred message in channel ${message.channel.id}`)
      } catch (error) {
        console.error("Error auto-starring message:", error)
      }
    }
    const isSameChannel = starboardConfig.channelId === starboardConfig.ratingChannelId
    const shouldStickToBottom = isSameChannel && starboardConfig.stickyEmbed
    if (shouldStickToBottom && message.channel.id === starboardConfig.channelId) {
      if (
        message.author.id !== client.user.id ||
        !message.embeds.length ||
        message.embeds[0].title !== starboardConfig.embed.title
      ) {
        const ratingEmbedId = client.ratingEmbedId || (await FileStorage.loadData("rating_embed_id", { id: null })).id
        if (ratingEmbedId) {
          try {
            const ratingEmbed = await message.channel.messages.fetch(ratingEmbedId).catch(() => null)
            if (ratingEmbed) {
              const components = ratingEmbed.components
              const embeds = ratingEmbed.embeds
              await ratingEmbed.delete().catch((err) => console.error("Error deleting rating embed:", err))
              const newEmbed = await message.channel.send({
                embeds: embeds,
                components: components,
              })
              client.ratingEmbedId = newEmbed.id
              await FileStorage.saveData("rating_embed_id", { id: newEmbed.id })
              console.log("Rating embed moved to bottom of channel")
            }
          } catch (error) {
            console.error("Error making rating embed sticky:", error)
          }
        }
      }
    }
  },
  async showRatingCommentModal(interaction, rating) {
    try {
      console.log(`Showing rating comment modal for rating: ${rating}`)
      const modal = new ModalBuilder()
        .setCustomId(`rating_modal_with_rating_${rating}`)
        .setTitle(`Rating with ${rating} ${rating === 1 ? "star" : "stars"}`)
      const commentInput = new TextInputBuilder()
        .setCustomId("comment_text")
        .setLabel("Your comment (optional)")
        .setPlaceholder("Write your comment here or leave the field empty...")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(0)
        .setMaxLength(1000)
        .setRequired(false)
      modal.addComponents(new ActionRowBuilder().addComponents(commentInput))
      await interaction.showModal(modal)
    } catch (error) {
      console.error("Error showing rating comment modal:", error)
      await interaction.reply({
        content: "An error occurred while opening the rating window.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   * @param {number} rating
   */
  async handleRating(interaction, client, rating) {
    try {
      const userId = interaction.user.id
      let ratingsData = client.ratings.get("server_rating")
      if (!ratingsData) {
        ratingsData = {
          totalRating: 0,
          ratingCount: 0,
          ratings: {},
          comments: [],
        }
        client.ratings.set("server_rating", ratingsData)
      }
      const previousRating = ratingsData.ratings[userId] ? ratingsData.ratings[userId].rating : 0
      if (previousRating > 0) {
        ratingsData.totalRating = ratingsData.totalRating - previousRating + rating
      } else {
        ratingsData.totalRating += rating
        ratingsData.ratingCount++
      }
      console.log(`Rating update - User: ${userId}, Previous: ${previousRating}, New: ${rating}`)
      console.log(
        `Rating stats - Total: ${ratingsData.totalRating}, Count: ${ratingsData.ratingCount}, Average: ${ratingsData.totalRating / ratingsData.ratingCount}`,
      )
      await FileStorage.saveData("server_ratings", ratingsData)
      const averageRating = ratingsData.totalRating / ratingsData.ratingCount
      await this.logRating(client, interaction.user, rating, previousRating)
      await interaction.reply({
        content: `Thank you for your rating! You gave ${rating} ${rating === 1 ? "star" : "stars"}.`,
        ephemeral: true,
      })
      await this.updateRatingEmbed(client, averageRating, ratingsData.ratingCount)
    } catch (error) {
      console.error("Error handling rating:", error)
      await interaction.reply({
        content: "An error occurred while processing your rating.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {Interaction} interaction
   */
  async showCommentModal(interaction) {
    try {
      console.log("Showing comment modal")
      const modal = new ModalBuilder().setCustomId("rating_modal_comment").setTitle("Add Comment")
      const commentInput = new TextInputBuilder()
        .setCustomId("comment_text")
        .setLabel("Your comment")
        .setPlaceholder("Write your comment here...")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(true)
      modal.addComponents(new ActionRowBuilder().addComponents(commentInput))
      await interaction.showModal(modal)
    } catch (error) {
      console.error("Error showing comment modal:", error)
      await interaction.reply({
        content: "An error occurred while opening the comment window.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {Interaction} interaction
   * @param {Client} client
   */
  async handleModalSubmit(interaction, client) {
    if (interaction.customId.startsWith("rating_modal_with_rating_")) {
      const rating = Number.parseInt(interaction.customId.split("_").pop())
      const commentText = interaction.fields.getTextInputValue("comment_text")
      await this.handleRatingWithComment(interaction, client, rating, commentText)
    } else if (interaction.customId === "rating_modal_comment") {
      try {
        const commentText = interaction.fields.getTextInputValue("comment_text")
        let ratingsData = client.ratings.get("server_rating")
        if (!ratingsData) {
          ratingsData = {
            totalRating: 0,
            ratingCount: 0,
            ratings: {},
            comments: [],
          }
          client.ratings.set("server_rating", ratingsData)
        }
        const comment = {
          userId: interaction.user.id,
          username: interaction.user.username,
          text: commentText,
          timestamp: Date.now(),
        }
        ratingsData.comments.push(comment)
        await FileStorage.saveData("server_ratings", ratingsData)
        await this.logComment(client, interaction.user, commentText)
        await interaction.reply({
          content: "Thank you for your comment!",
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error handling comment:", error)
        await interaction.reply({
          content: "An error occurred while adding your comment.",
          ephemeral: true,
        })
      }
    }
  },
  async handleRatingWithComment(interaction, client, rating, commentText) {
    try {
      const userId = interaction.user.id
      let ratingsData = client.ratings.get("server_rating")
      if (!ratingsData) {
        ratingsData = {
          totalRating: 0,
          ratingCount: 0,
          ratings: {},
          comments: [],
        }
        client.ratings.set("server_rating", ratingsData)
      }
      const allowMultipleRatings = starboardConfig.allowMultipleRatings || false
      const userRatings = ratingsData.ratings[userId] || []
      const hasRatedBefore = Array.isArray(userRatings) ? userRatings.length > 0 : !!userRatings
      if (hasRatedBefore && starboardConfig.ratingCooldown > 0) {
        const lastRating = Array.isArray(userRatings) ? userRatings[userRatings.length - 1] : userRatings
        const cooldownTime = starboardConfig.ratingCooldown * 1000
        const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
        const timeSinceLastRating = Date.now() - lastRating.timestamp
        if (timeSinceLastRating < cooldownTime) {
          const remainingTime = Math.ceil((cooldownTime - timeSinceLastRating) / 1000)
          let timeDisplay
          if (remainingTime < 60) {
            timeDisplay = `${remainingTime} seconds`
          } else if (remainingTime < 3600) {
            timeDisplay = `${Math.ceil(remainingTime / 60)} minutes`
          } else if (remainingTime < 86400) {
            timeDisplay = `${Math.ceil(remainingTime / 3600)} hours`
          } else {
            timeDisplay = `${Math.ceil(remainingTime / 86400)} days`
          }
          await interaction.reply({
            content: `You must wait ${timeDisplay} before you can rate again.`,
            ephemeral: true,
          })
          return
        }
      }
      const finalComment = commentText && commentText.trim().length > 0 ? commentText.trim() : null
      const newRating = {
        rating,
        username: interaction.user.username,
        timestamp: Date.now(),
        comment: finalComment,
      }
      console.log(`New rating from ${userId}: ${rating} stars`)
      if (allowMultipleRatings) {
        if (!Array.isArray(ratingsData.ratings[userId])) {
          if (ratingsData.ratings[userId]) {
            ratingsData.ratings[userId] = [ratingsData.ratings[userId]]
          } else {
            ratingsData.ratings[userId] = []
          }
        }
        ratingsData.ratings[userId].push(newRating)
        ratingsData.totalRating += rating
        ratingsData.ratingCount++
      } else {
        const previousRating = ratingsData.ratings[userId] ? ratingsData.ratings[userId].rating : 0
        ratingsData.ratings[userId] = newRating
        if (previousRating > 0) {
          ratingsData.totalRating = ratingsData.totalRating - previousRating + rating
        } else {
          ratingsData.totalRating += rating
          ratingsData.ratingCount++
        }
      }
      console.log(`Rating update - User: ${userId}, New: ${rating}`)
      console.log(
        `Rating stats - Total: ${ratingsData.totalRating}, Count: ${ratingsData.ratingCount}, Average: ${ratingsData.totalRating / ratingsData.ratingCount}`,
      )
      await FileStorage.saveData("server_ratings", ratingsData)
      const averageRating = ratingsData.totalRating / ratingsData.ratingCount
      await this.logRatingWithComment(client, interaction.user, rating, finalComment)
      let replyMessage = `Danke für deine Bewertung! Du hast ${rating} ${rating === 1 ? "Stern" : "Sterne"} gegeben.`
      if (finalComment) {
        replyMessage += " und einen Kommentar hinterlassen."
      }
      await interaction.reply({
        content: replyMessage,
        ephemeral: true,
      })
      await this.updateRatingEmbed(client, averageRating, ratingsData.ratingCount)
      const isSameChannel = starboardConfig.channelId === starboardConfig.ratingChannelId
      const shouldStickToBottom = isSameChannel && starboardConfig.stickyEmbed

      if (shouldStickToBottom) {
        const channel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
        if (channel) {
          const ratingEmbedId = client.ratingEmbedId || (await FileStorage.loadData("rating_embed_id", { id: null })).id
          if (ratingEmbedId) {
            try {
              const ratingEmbed = await channel.messages.fetch(ratingEmbedId).catch(() => null)
              if (ratingEmbed) {
                const components = ratingEmbed.components
                const embeds = ratingEmbed.embeds
                await ratingEmbed.delete().catch((err) => console.error("Error deleting rating embed:", err))
                const newEmbed = await channel.send({
                  embeds: embeds,
                  components: components,
                })
                client.ratingEmbedId = newEmbed.id
                await FileStorage.saveData("rating_embed_id", { id: newEmbed.id })
                console.log("Rating embed moved to bottom of channel after rating")
              }
            } catch (error) {
              console.error("Error making rating embed sticky after rating:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error handling rating with comment:", error)
      await interaction.reply({
        content: "Bei der Bewertung ist ein Fehler aufgetreten.",
        ephemeral: true,
      })
    }
  },
  /**
   * @param {Client} client
   * @param {number} averageRating
   * @param {number} ratingCount
   */
  async updateRatingEmbed(client, averageRating, ratingCount) {
    try {
      const channel = await client.channels.fetch(starboardConfig.channelId).catch(() => null)
      if (!channel) {
        console.error(`Rating channel ${starboardConfig.channelId} not found`)
        return
      }
      let messageId = client.ratingEmbedId
      if (!messageId) {
        const savedData = await FileStorage.loadData("rating_embed_id", { id: null })
        messageId = savedData.id
      }
      if (!messageId) {
        console.log("No rating embed message ID found, creating new embed...")
        await this.createRatingEmbed(client)
        return
      }
      let message = await channel.messages.fetch(messageId).catch(() => null)
      if (!message) {
        console.log(`Rating embed message ${messageId} not found, creating new embed...`)
        await FileStorage.saveData("rating_embed_id", { id: null })
        client.ratingEmbedId = null
        await this.createRatingEmbed(client)
        return
      }
      if (message.author.id !== client.user.id || !message.embeds || message.embeds.length === 0) {
        console.log("Message is not a valid rating embed, creating new one...")
        await this.createRatingEmbed(client)
        return
      }
      const embed = EmbedBuilder.from(message.embeds[0])
      const statsText = `Average Rating: ${averageRating.toFixed(1)} ⭐ (${ratingCount} ratings)`
      const statsFieldIndex = embed.data.fields?.findIndex((field) => field.name === "Statistics")
      if (statsFieldIndex !== undefined && statsFieldIndex >= 0) {
        embed.data.fields[statsFieldIndex].value = statsText
      } else {
        embed.addFields({ name: "Statistics", value: statsText })
      }
      await message.edit({ embeds: [embed] })
      console.log(`Rating embed updated successfully with ID: ${message.id}`)
    } catch (error) {
      console.error("Error updating rating embed:", error)
      try {
        console.log("Attempting to recreate rating embed due to error...")
        await FileStorage.saveData("rating_embed_id", { id: null })
        client.ratingEmbedId = null
        await this.createRatingEmbed(client)
      } catch (recreateError) {
        console.error("Error recreating rating embed:", recreateError)
      }
    }
  },
  async logRatingWithComment(client, user, rating, comment, previousRating) {
    try {
      const channel = await client.channels.fetch(starboardConfig.ratingChannelId).catch(() => null)
      if (!channel) {
        console.error(`Rating log channel ${starboardConfig.ratingChannelId} not found`)
        return
      }
      const stars = "⭐".repeat(rating)
      const embed = new EmbedBuilder()
        .setAuthor({
          name: user.tag,
          iconURL: user.displayAvatarURL(),
        })
        .setTitle("New Rating")
        .setColor(starboardConfig.embed.color)
        .addFields({
          name: "User Rating",
          value: stars,
        })
      if (comment && comment.trim().length > 0) {
        embed.setDescription(comment)
      } else {
        embed.addFields({
          name: "Comment",
          value: "*No comment provided*",
        })
      }
      if (previousRating > 0) {
        const previousStars = "⭐".repeat(previousRating)
        embed.addFields({
          name: "Previous Rating",
          value: previousStars,
        })
      }
      if (starboardConfig.embed.showTimestamp) {
        embed.setTimestamp()
      }
      if (starboardConfig.embed.footer) {
        embed.setFooter({
          text: starboardConfig.embed.footer,
          iconURL: starboardConfig.embed.footerIconUrl,
        })
      }
      await channel.send({ embeds: [embed] })
      const isSameChannel = starboardConfig.channelId === starboardConfig.ratingChannelId
      const shouldStickToBottom = isSameChannel && starboardConfig.stickyEmbed
      if (shouldStickToBottom) {
        const ratingEmbedId = client.ratingEmbedId || (await FileStorage.loadData("rating_embed_id", { id: null })).id
        if (ratingEmbedId) {
          try {
            const ratingEmbed = await channel.messages.fetch(ratingEmbedId).catch(() => null)
            if (ratingEmbed) {
              const components = ratingEmbed.components
              const embeds = ratingEmbed.embeds
              await ratingEmbed.delete().catch((err) => console.error("Error deleting rating embed:", err))
              const newEmbed = await channel.send({
                embeds: embeds,
                components: components,
              })
              client.ratingEmbedId = newEmbed.id
              await FileStorage.saveData("rating_embed_id", { id: newEmbed.id })
              console.log("Rating embed moved to bottom of channel after log")
            }
          } catch (error) {
            console.error("Error making rating embed sticky after log:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error logging rating with comment:", error)
    }
  },
  async logComment(client, user, comment) {
    try {
      const channel = await client.channels.fetch(starboardConfig.ratingChannelId).catch(() => null)
      if (!channel) {
        console.error(`Rating log channel ${starboardConfig.ratingChannelId} not found`)
        return
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: user.tag,
          iconURL: user.displayAvatarURL(),
        })
        .setTitle("New Comment")
        .setDescription(comment)
        .setColor(starboardConfig.embed.color)
      const ratingsData = client.ratings.get("server_rating")
      if (ratingsData && ratingsData.ratings[user.id]) {
        const userRating = ratingsData.ratings[user.id].rating
        const stars = "⭐".repeat(userRating)
        embed.addFields({
          name: "User Rating",
          value: stars,
        })
      }
      if (starboardConfig.embed.showTimestamp) {
        embed.setTimestamp()
      }
      if (starboardConfig.embed.footer) {
        embed.setFooter({
          text: starboardConfig.embed.footer,
          iconURL: starboardConfig.embed.footerIconUrl,
        })
      }
      await channel.send({ embeds: [embed] })
      const isSameChannel = starboardConfig.channelId === starboardConfig.ratingChannelId
      const shouldStickToBottom = isSameChannel && starboardConfig.stickyEmbed
      if (shouldStickToBottom) {
        const ratingEmbedId = client.ratingEmbedId || (await FileStorage.loadData("rating_embed_id", { id: null })).id
        if (ratingEmbedId) {
          try {
            const ratingEmbed = await channel.messages.fetch(ratingEmbedId).catch(() => null)
            if (ratingEmbed) {
              const components = ratingEmbed.components
              const embeds = ratingEmbed.embeds
              await ratingEmbed.delete().catch((err) => console.error("Error deleting rating embed:", err))
              const newEmbed = await channel.send({
                embeds: embeds,
                components: components,
              })
              client.ratingEmbedId = newEmbed.id
              await FileStorage.saveData("rating_embed_id", { id: newEmbed.id })
              console.log("Rating embed moved to bottom of channel after comment")
            }
          } catch (error) {
            console.error("Error making rating embed sticky after comment:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error logging comment:", error)
    }
  },
  /**
   * @param {Client} client
   * @returns {Object}
   */
  async verifyRatingsData(client) {
    try {
      let ratingsData = client.ratings.get("server_rating")
      if (!ratingsData) {
        ratingsData = await FileStorage.loadData("server_ratings", {
          totalRating: 0,
          ratingCount: 0,
          ratings: {},
          comments: [],
        })
        client.ratings.set("server_rating", ratingsData)
      }
      let calculatedTotal = 0
      let calculatedCount = 0
      console.log("Starting rating verification...")
      console.log("Current stored totals:", ratingsData.totalRating, ratingsData.ratingCount)
      for (const userId in ratingsData.ratings) {
        const userRating = ratingsData.ratings[userId]
        if (Array.isArray(userRating)) {
          for (const rating of userRating) {
            if (rating && rating.rating >= 1 && rating.rating <= 5) {
              calculatedTotal += rating.rating
              calculatedCount++
              console.log(`User ${userId} rating: ${rating.rating}`)
            }
          }
        } else if (userRating && userRating.rating >= 1 && userRating.rating <= 5) {
          calculatedTotal += userRating.rating
          calculatedCount++
          console.log(`User ${userId} rating: ${userRating.rating}`)
        }
      }
      console.log("Calculated totals:", calculatedTotal, calculatedCount)
      if (calculatedTotal !== ratingsData.totalRating || calculatedCount !== ratingsData.ratingCount) {
        console.log(
          `Repairing ratings data - Stored: ${ratingsData.totalRating}/${ratingsData.ratingCount}, Calculated: ${calculatedTotal}/${calculatedCount}`,
        )
        ratingsData.totalRating = calculatedTotal
        ratingsData.ratingCount = calculatedCount
        await FileStorage.saveData("server_ratings", ratingsData)
        client.ratings.set("server_rating", ratingsData)
      }
      return ratingsData
    } catch (error) {
      console.error("Error verifying ratings data:", error)
      return null
    }
  },
}
