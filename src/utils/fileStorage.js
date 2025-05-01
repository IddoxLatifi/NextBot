const fs = require("fs")
const path = require("path")
const dataDir = path.join(__dirname, "../../data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}
class FileStorage {
  /**
   * @param {string} filename 
   * @param {Object} data 
   * @returns {Promise<boolean>} 
   */
  static async saveData(filename, data) {
    try {
      const filePath = path.join(dataDir, `${filename}.json`)
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2))
      return true
    } catch (error) {
      console.error(`Error saving data to ${filename}.json:`, error)
      return false
    }
  }
  /**
   * @param {string} filename 
   * @param {Object} defaultData 
   * @returns {Promise<Object>}
   */
  static async loadData(filename, defaultData = {}) {
    try {
      const filePath = path.join(dataDir, `${filename}.json`)
      if (!fs.existsSync(filePath)) {
        return defaultData
      }
      const data = await fs.promises.readFile(filePath, "utf8")
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error loading data from ${filename}.json:`, error)
      return defaultData
    }
  }
  /**
   * @param {string} filename
   * @returns {boolean} 
   */
  static fileExists(filename) {
    const filePath = path.join(dataDir, `${filename}.json`)
    return fs.existsSync(filePath)
  }
}
module.exports = FileStorage
