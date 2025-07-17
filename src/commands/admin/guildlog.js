const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const guildLogger = require('../../modules/guildLogger')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('guildlog')
    .setDescription('Setzt den Channel für Guild-Log-Events')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Setzt den Channel für Guild-Log-Events')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel für Logs').setRequired(true)
        )
    ),
  permissions: {
    user: [PermissionFlagsBits.Administrator],
    bot: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
    adminOnly: true,
  },
  cooldown: 5,
  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand()
    if (sub === 'set') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'Nur Administratoren können diesen Befehl nutzen.', ephemeral: true })
      }
      const channel = interaction.options.getChannel('channel')
      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: 'Bitte wähle einen Textkanal aus.', ephemeral: true })
      }
      await guildLogger.setLogChannel(channel.id)
      return interaction.reply({ content: `Guild-Log-Channel wurde auf ${channel} gesetzt.`, ephemeral: true })
    }
  },
} 