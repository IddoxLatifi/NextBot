require("dotenv").config()
const { REST, Routes } = require("discord.js")
const fs = require("fs")
const path = require("path")
const chalk = require("chalk")
const _createdBy = '@apt_start_latifi | https://nextbot.store/ | https://discord.gg/KcuMUUAP5T';
const args = process.argv.slice(2)
const shouldDeleteCommands = args.includes("--delete") || args.includes("-d")
const commands = []
const foldersPath = path.join(__dirname, "src/commands")
const commandFolders = fs.readdirSync(foldersPath)
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder)
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"))
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
    const command = require(filePath)
    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON())
      console.log(chalk.green(`✓ Added command: ${command.data.name}`))
    } else {
      console.log(
        chalk.yellow(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`),
      )
    }
  }
}
const rest = new REST().setToken(process.env.DISCORD_TOKEN)
;(async () => {
  try {
    if (shouldDeleteCommands) {
      console.log(chalk.yellow("Deleting all application commands..."))
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] })
        console.log(chalk.green("Successfully deleted all guild commands."))
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
        console.log(chalk.green("Successfully deleted all global commands."))
      }
      if (args.includes("--delete-only")) {
        console.log(chalk.blue("Command deletion completed. Exiting without deploying new commands."))
        return
      }
    }
    console.log(chalk.blue(`Started refreshing ${commands.length} application (/) commands.`))
    let data
    if (process.env.GUILD_ID) {
      data = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
        body: commands,
      })
      console.log(chalk.green(`Successfully reloaded ${data.length} guild (/) commands.`))
    } else {
      data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
      console.log(chalk.green(`Successfully reloaded ${data.length} global (/) commands.`))
    }
  } catch (error) {
    console.error(chalk.red(error))
  }
})()
