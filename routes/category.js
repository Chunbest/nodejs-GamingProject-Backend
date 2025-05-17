const express = require('express')

const router = express.Router()
const controller = require('../controllers/category')

router.get('/', controller.getCategories)

module.exports = router