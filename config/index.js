// 載入 dotenv 套件，用來讀取 .env 檔案中的環境變數
const dotenv = require('dotenv')


if (process.env.RENDER) {
	// Render 平台上執行，使用 Render 環境變數（不載入 .env）
	console.log("[dotenv] 偵測到 Render 環境，使用 Render 設定的環境變數。");
} else {
	// 本地端執行，嘗試載入 .env 檔案
	const result = dotenv.config();

	if (result.error) {
		console.error("[dotenv] 載入 .env 檔案失敗：", result.error);
		throw result.error;
	} else {
		console.log("[dotenv] 成功載入本地 .env 檔案。");
	}
  }

const db = require('./db')
const web = require('./web')
const secret = require('./secret')


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
