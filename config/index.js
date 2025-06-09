// 載入 dotenv 套件，用來讀取 .env 檔案中的環境變數
const dotenv = require('dotenv')

// 判斷目前是否在 Render 雲端平台上執行：
// 如果不是（本地開發環境），才需要嘗試載入 .env 檔案
if (!process.env.RENDER) {
  // 嘗試載入根目錄下的 .env 檔案，結果會存入 result
  const result = dotenv.config()

  // 如果載入過程出現錯誤（例如檔案不存在或格式錯誤）
  if (result.error) {
    // 印出錯誤訊息到終端機，方便開發者排錯
    console.error("[dotenv] 無法讀取 .env 檔案：", result.error)

    // 終止程式執行，避免缺少必要的環境變數導致後續錯誤
    throw result.error
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
