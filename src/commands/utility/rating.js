const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const EmbedBuilder = require("../../utils/embedBuilder")
const FileStorage = require("../../utils/fileStorage")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("rating")
    .setDescription("Commands for the rating system")
    .addSubcommand((subcommand) => subcommand.setName("create").setDescription("Creates a new rating embed"))
    .addSubcommand((subcommand) => subcommand.setName("stats").setDescription("Shows statistics about the ratings"))
    .addSubcommand((subcommand) => subcommand.setName("reset").setDescription("Resets all ratings (admin only)")),
  permissions: {
    user: [PermissionFlagsBits.ManageMessages],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand()
    if (subcommand === "create") {
      try {
        const starboardModule = require("../../modules/starboard")
        await starboardModule.createRatingEmbed(client)
        await interaction.reply({
          embeds: [EmbedBuilder.success("Rating System", "The rating embed has been recreated.")],
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error creating rating embed:", error)
        await interaction.reply({
          embeds: [EmbedBuilder.error("Error", "An error occurred while creating the rating embed.")],
          ephemeral: true,
        })
      }
    } else if (subcommand === "stats") {
      try {
        const starboardModule = require("../../modules/starboard")
        const ratingsData = await starboardModule.verifyRatingsData(client)
        console.log(`Stats command - Total ratings: ${ratingsData.totalRating}, Count: ${ratingsData.ratingCount}`)
        const averageRating = ratingsData.ratingCount > 0 ? ratingsData.totalRating / ratingsData.ratingCount : 0
        console.log(`Calculated average: ${averageRating} (${ratingsData.totalRating} / ${ratingsData.ratingCount})`)
        const commentCount = ratingsData.comments ? ratingsData.comments.length : 0
        const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"
        const ratingCounts = [0, 0, 0, 0, 0]
        const uniqueUsers = new Set()
        for (const userId in ratingsData.ratings) {
          uniqueUsers.add(userId)
          const userRating = ratingsData.ratings[userId]

          if (Array.isArray(userRating)) {
            console.log(`User ${userId} has ${userRating.length} ratings`)
            for (const rating of userRating) {
              if (rating && rating.rating >= 1 && rating.rating <= 5) {
                ratingCounts[rating.rating - 1]++
                console.log(`Added rating: ${rating.rating}`)
              }
            }
          } else if (userRating && userRating.rating >= 1 && userRating.rating <= 5) {
            ratingCounts[userRating.rating - 1]++
            console.log(`Added single rating: ${userRating.rating}`)
          }
        }
        console.log(`Rating counts: ${ratingCounts.join(", ")}`)
        const embed = EmbedBuilder.create({
          title: "Rating Statistics",
          description: `Here are the current statistics for the rating system.`,
          color: "#FFD700",
        })
        embed.addFields(
          { name: "Average Rating", value: `${averageRating.toFixed(1)} ⭐`, inline: true },
          { name: "Number of Ratings", value: `${ratingsData.ratingCount}`, inline: true },
          { name: "Unique Users", value: `${uniqueUsers.size}`, inline: true },
          { name: "Number of Comments", value: `${commentCount}`, inline: true },
          {
            name: "Distribution",
            value:
              `⭐: ${ratingCounts[0]} (${
                ratingsData.ratingCount > 0 ? ((ratingCounts[0] / ratingsData.ratingCount) * 100).toFixed(1) : 0
              }%)\n` +
              `⭐⭐: ${ratingCounts[1]} (${
                ratingsData.ratingCount > 0 ? ((ratingCounts[1] / ratingsData.ratingCount) * 100).toFixed(1) : 0
              }%)\n` +
              `⭐⭐⭐: ${ratingCounts[2]} (${
                ratingsData.ratingCount > 0 ? ((ratingCounts[2] / ratingsData.ratingCount) * 100).toFixed(1) : 0
              }%)\n` +
              `⭐⭐⭐⭐: ${ratingCounts[3]} (${
                ratingsData.ratingCount > 0 ? ((ratingCounts[3] / ratingsData.ratingCount) * 100).toFixed(1) : 0
              }%)\n` +
              `⭐⭐⭐⭐⭐: ${ratingCounts[4]} (${
                ratingsData.ratingCount > 0 ? ((ratingCounts[4] / ratingsData.ratingCount) * 100).toFixed(1) : 0
              }%)`,
          },
        )
        await interaction.reply({ embeds: [embed] })
      } catch (error) {
        console.error("Error showing rating stats:", error)
        await interaction.reply({
          embeds: [EmbedBuilder.error("Error", "An error occurred while displaying the rating statistics.")],
          ephemeral: true,
        })
      }
    } else if (subcommand === "reset") {
      if (interaction.user.id !== process.env.ADMIN_ID) {
        return interaction.reply({
          embeds: [EmbedBuilder.error("Error", "Only administrators can reset ratings.")],
          ephemeral: true,
        })
      }
      try {
        const newRatingsData = {
          totalRating: 0,
          ratingCount: 0,
          ratings: {},
          comments: [],
        }
        client.ratings.set("server_rating", newRatingsData)
        await FileStorage.saveData("server_ratings", newRatingsData)
        const starboardModule = require("../../modules/starboard")
        await starboardModule.updateRatingEmbed(client, 0, 0)
        await interaction.reply({
          embeds: [EmbedBuilder.success("Ratings Reset", "All ratings have been reset.")],
          ephemeral: true,
        })
      } catch (error) {
        console.error("Error resetting ratings:", error)
        await interaction.reply({
          embeds: [EmbedBuilder.error("Error", "An error occurred while resetting the ratings.")],
          ephemeral: true,
        })
      }
    }
  },
}
