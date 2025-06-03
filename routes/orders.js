const express = require('express')

const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('users'),
  logger
})
// 改寫, 在 routes/orders.js 預先執行 dataSource.getRepository('users')
// 這樣會讓你測試時無法 mock，建議改寫 auth.js，讓它在 middleware 被執行時才取用 dataSource

// const auth = require('../middlewares/auth')(dataSource, config.get('secret'), logger);
const router = express.Router()
const controller = require('../controllers/orders')

router.post('/', auth, controller.postOrder)

module.exports = router
