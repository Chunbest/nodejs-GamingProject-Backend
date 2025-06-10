const express = require('express')

const router = express.Router()
const controller = require('../controllers/category')

router.get('/', controller.getCategories)
router.post('/', controller.postCategories)

module.exports = router