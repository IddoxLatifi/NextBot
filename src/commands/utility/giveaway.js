const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Creates a giveaway")
    .addStringOption((option) => option.setName("prize").setDescription("The prize of the giveaway").setRequired(true))
    .addStringOption((option) =>
      option.setName("duration").setDescription("The duration of the giveaway (e.g. 1d, 12h, 30m)").setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName("winners").setDescription("Number of winners").setMinValue(1).setMaxValue(10).setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("Description of the giveaway").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("image").setDescription("URL of the image for the giveaway").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("banner").setDescription("URL of the banner for the giveaway").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("color").setDescription("Color of the embed (HEX code, e.g. #FF4500)").setRequired(false),
    )
    .addUserOption((option) =>
      option.setName("sponsor").setDescription("The sponsor of the giveaway (will be pinged)").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("sponsorwebsite").setDescription("Website of the sponsor (with https://)").setRequired(false),
    ),
  permissions: {
    user: [PermissionFlagsBits.ManageGuild],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: false,
  },
  cooldown: 10,
  async execute(interaction, client) {
    const prize = interaction.options.getString("prize")
    const duration = interaction.options.getString("duration")
    const winners = interaction.options.getInteger("winners")
    const description = interaction.options.getString("description") || ""
    const imageUrl = interaction.options.getString("image") || null
    const bannerUrl = interaction.options.getString("banner") || null
    const color = interaction.options.getString("color") || null
    const sponsor = interaction.options.getUser("sponsor") || null
    const sponsorWebsite = interaction.options.getString("sponsorwebsite") || null

    if (sponsorWebsite && !sponsorWebsite.startsWith("https://")) {
      return interaction.reply({
        content: "The sponsor website must start with https://.",
        ephemeral: true,
      })
    }

    const giveawayModule = require("../../modules/giveaway")
    const _createdBy = "@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T"

    await giveawayModule.createGiveaway(interaction, client, {
      prize,
      duration,
      winners,
      description,
      imageUrl,
      bannerUrl,
      color,
      sponsor,
      sponsorWebsite,
    })
  },
}
