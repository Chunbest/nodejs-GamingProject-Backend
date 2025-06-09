// 載入 dotenv 套件，用來讀取 .env 檔案中的環境變數
const dotenv = require('dotenv')

// 只有在開發環境才讀取本地 .env
const NODE_ENV = process.env.NODE_ENV || 'development';

// 如果是開發環境，就載入 .env 檔案
if (NODE_ENV === 'development') {
	const result = dotenv.config();
	if (result.error) {
		console.error('[dotenv] 無法讀取 .env 檔案：', result.error);
		throw result.error;
	}
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
