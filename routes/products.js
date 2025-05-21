const express = require('express')

const router = express.Router()
const controller = require('../controllers/products')

router.get('/', controller.getProducts)

router.get('/:products_id', controller.getProductDetail)

module.exports = router
