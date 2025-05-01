require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const chalk = require("chalk");
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
client.commands = new Collection();
client.cooldowns = new Collection();
client.afkUsers = new Collection();
client.giveaways = new Collection();
client.ratings = new Map();
client.starboardMessages = new Map();
client.starboardRatings = new Map();
client.recentMentions = new Map();
console.log(chalk.blueBright("➤ Using file-based storage only..."));
const foldersPath = path.join(__dirname, "src/commands");
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(chalk.green(`✓ Loaded command: ${chalk.yellow(command.data.name)}`));
    } else {
      console.log(
        chalk.red(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
      );
    }
  }
}
const eventsPath = path.join(__dirname, "src/events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(chalk.green(`✓ Loaded event: ${chalk.cyan(event.name)}`));
}
const modulesPath = path.join(__dirname, "src/modules");
const moduleFiles = fs.readdirSync(modulesPath).filter((file) => file.endsWith(".js"));
for (const file of moduleFiles) {
  const filePath = path.join(modulesPath, file);
  const module = require(filePath);
  if (module.init) {
    module.init(client);
    console.log(chalk.green(`✓ Initialized module: ${chalk.magenta(module.name)}`));
  }
}
client.login(process.env.DISCORD_TOKEN).then(() => {
  console.clear();
  console.log(chalk.cyanBright(`
█▄░█ █▀▀ ▀▄▀ ▀█▀ █▄▄ █▀█ ▀█▀
█░▀█ ██▄ █░█ ░█░ █▄█ █▄█ ░█░
  `));
  console.log(chalk.greenBright("\nNextBot is now online!\n"));
  console.log(chalk.yellow("Developed by: ") + chalk.white("@apt_start_latifi"));
  console.log(chalk.yellow("Website: ") + chalk.white("https://nextbot.store/"));
  console.log(chalk.yellow("Discord: ") + chalk.white("https://discord.gg/KcuMUUAP5T"));
}).catch((error) => {
  console.error(chalk.redBright("❌ Error logging in:"), error);
});
