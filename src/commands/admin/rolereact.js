const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js")
const roleReactConfig = require("../../config/rolereact")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
module.exports = {
  data: new SlashCommandBuilder()
    .setName("rolereact")
    .setDescription("Manage the role reaction system")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set the channel for role reactions")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel in which the role reactions should be displayed")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add a role to the role reactions")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to be added").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("name").setDescription("The name to be displayed for the role").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("emoji")
            .setDescription("The emoji to be displayed for the role")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("The color of the button")
            .setRequired(true)
            .addChoices(
              ...roleReactConfig.availableColors.map((color) => ({
                name: color.name,
                value: color.value,
              })),
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("Remove a role from the role reactions")
        .addRoleOption((option) =>
          option.setName("role").setDescription("The role to be removed").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("send").setDescription("Send or update the role reaction message"),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("List all available role reactions"),
    ),
  permissions: {
    user: [PermissionFlagsBits.ManageRoles, PermissionFlagsBits.ManageGuild],
    bot: [PermissionFlagsBits.ManageRoles],
    adminOnly: false,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand()
    const roleReactModule = require("../../modules/rolereact")
    switch (subcommand) {
      case "set":
        const channel = interaction.options.getChannel("channel")
        await roleReactModule.setChannel(interaction, client, channel.id)
        break
      case "add":
        const role = interaction.options.getRole("role")
        const name = interaction.options.getString("name")
        const emoji = interaction.options.getString("emoji")
        const color = interaction.options.getString("color")
        const roleData = {
          roleId: role.id,
          name,
          emoji,
          color,
        }
        await roleReactModule.addRole(interaction, client, roleData)
        break
      case "remove":
        const roleToRemove = interaction.options.getRole("role")
        await roleReactModule.removeRole(interaction, client, roleToRemove.id)
        break
      case "send":
        await roleReactModule.sendRoleReactionMessage(interaction, client)
        break
      case "list":
        await roleReactModule.listRoles(interaction, client)
        break
      default:
        await interaction.reply({
          content: "Unknown subcommand.",
          ephemeral: true,
        })
    }
  },
}
