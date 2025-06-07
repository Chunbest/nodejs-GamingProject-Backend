// 載入 dotenv 套件，用來讀取 .env 檔的環境變數
const dotenv = require('dotenv');

// 載入 Node.js 內建的 fs（File System）模組，用來操作檔案
const fs = require('fs');

// ✅【判斷用】：如果目前目錄下有 `.env` 檔案（表示你是在本地開發）
if (fs.existsSync('.env')) {
	// 📥 嘗試載入 .env 檔案內容到 process.env
	const result = dotenv.config();

	// ⚠️ 如果讀取失敗（通常是格式錯誤），印出警告
	if (result.error) {
		console.warn('⚠️ Failed to load .env file', result.error);
	}
}

const db = require('./db')
const web = require('./web')
const secret = require('./secret')

if (result.error) {
  throw result.error
}
const config = {
  db,
  web,
  secret
}

class ConfigManager {
  /**
   * Retrieves a configuration value based on the provided dot-separated path.
   * Throws an error if the specified configuration path is not found.
   *
   * @param {string} path - Dot-separated string representing the configuration path.
   * @returns {*} - The configuration value corresponding to the given path.
   * @throws Will throw an error if the configuration path is not found.
   */

  static get (path) {
    if (!path || typeof path !== 'string') {
      throw new Error(`incorrect path: ${path}`)
    }
    const keys = path.split('.')
    let configValue = config
    keys.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(configValue, key)) {
        throw new Error(`config ${path} not found`)
      }
      configValue = configValue[key]
    })
    return configValue
  }
}

module.exports = ConfigManager
