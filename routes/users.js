const express = require('express')

const usersController = require('../controllers/users')
const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const auth = require('../middlewares/auth')({
  secret: config.get('secret').jwtSecret,
  userRepository: dataSource.getRepository('users'),
  logger
})

router.post('/signup', usersController.postSignup)

router.post('/signin', usersController.postSignin)

// router.get('/profile', auth, usersController.getProfile)

// router.put('/profile', auth, usersController.putProfile)

// router.put('/password', auth, usersController.putPassword)
module.exports = router
