const express = require('express')

const router = express.Router()
const config = require('../config/index')
const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('Users')
const usersController = require('../controllers/users')
const auth = require('../middlewares/auth')({
	secret: config.get('secret').jwtSecret,
	userRepository: dataSource.getRepository('users'),
	logger
})

router.post('/sign-up', usersController.postSignup)

router.post('/sign-in', usersController.postSignin)

router.get('/profile', auth, usersController.getProfile)

router.put('/profile', auth, usersController.putProfile)

router.put('/password', auth, usersController.putPassword)

module.exports = router
