const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js')
const FileStorage = require('../../utils/fileStorage')
const livestatsConfig = require('../../config/livestats')
const fs = require('fs')
const path = require('path')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('livestats')
    .setDescription('Livestats Einstellungen')
    .addSubcommand(sub =>
      sub
        .setName('set')
        .setDescription('Setzt den Channel für Livestats')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('Channel für Livestats').setRequired(true)
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
      const configPath = path.join(__dirname, '../../config/livestats.js')
      let configContent = fs.readFileSync(configPath, 'utf8')
      configContent = configContent.replace(/channelId:\s*["'](.*)["']/, `channelId: "${channel.id}"`)
      fs.writeFileSync(configPath, configContent)
      livestatsConfig.channelId = channel.id
      return interaction.reply({ content: `Livestats-Channel wurde auf ${channel} gesetzt.`, ephemeral: true })
    }
  },
} 