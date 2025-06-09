// 載入 dotenv 套件，用來讀取 .env 檔案中的環境變數
const dotenv = require('dotenv')

const result = dotenv.config()
// 如果 dotenv 載入 .env 檔失敗，且目前不是在 Render 上執行（process.env.RENDER 不存在）
if (result.error && !process.env.RENDER) {
	// 顯示錯誤訊息：提示無法讀取 .env 檔案的原因
	console.error("[dotenv] 無法讀取 .env：", result.error);

	// 中斷程式執行，避免在本地開發時因缺少變數導致後續錯誤
	throw result.error;
}

const db = require('./db')
const web = require('./web')
const secret = require('./secret')

// if (result.error) {
//   throw result.error
// }
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
