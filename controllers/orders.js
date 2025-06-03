const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('OrderController')

function isUndefined(value) {
	return value === undefined
}

function isNotValidSting(value) {
	return typeof value !== 'string' || value.trim().length === 0 || value === ''
}

function isNotValidInteger(value) {
	return typeof value !== 'number' || value < 0 || value % 1 !== 0
}

function isNotValidOrder(order) {
	if (isUndefined(order) || !Array.isArray(order)) {
		return false
	}
	for (let index = 0; index < order.length; index++) {
		const element = order[index]
		if (isUndefined(element) ||
			!Object.prototype.hasOwnProperty.call(element, 'products_id') ||
			!Object.prototype.hasOwnProperty.call(element, 'quantity') ||
			!Object.prototype.hasOwnProperty.call(element, 'spec') ||
			!Object.prototype.hasOwnProperty.call(element, 'colors') ||
			isNotValidSting(element.products_id) ||
			isNotValidInteger(element.quantity) ||
			isNotValidSting(element.spec) ||
			isNotValidSting(element.colors)) {
			return true
		}
	}
	return false
}

class OrderController {
	static async postOrder(req, res, next) {
		try {
			const userNameReg = /^[\p{L}\p{N}]{2,50}$/u
			const telReg = /^09\d{8}$/
			const paymentMethodReg = /^[1-3]$/
			const { user, orders, payment_methods: paymentMethods } = req.body
			if (isUndefined(user) || !Object.prototype.hasOwnProperty.call(user, 'name') ||
				!Object.prototype.hasOwnProperty.call(user, 'tel') ||
				!Object.prototype.hasOwnProperty.call(user, 'address') ||
				isNotValidSting(user.name) || !userNameReg.test(user.name) ||
				isNotValidSting(user.tel) || !telReg.test(user.tel) ||
				isNotValidSting(user.address) || user.address.length > 30 ||
				isNotValidOrder(orders) ||
				isNotValidInteger(paymentMethods) || !paymentMethodReg.test(paymentMethods)) {
				logger.warn('欄位未填寫正確')
				res.status(400).json({
					message: '欄位未填寫正確'
				})
				return
			}
			const { id } = req.user
			const orderRepository = dataSource.getRepository('orders')
			const newOrder = await orderRepository.save(orderRepository.create({
				users_id: id,
				name: user.name,
				tel: user.tel,
				address: user.address,
				is_paid: false,
				payment_methods_id: paymentMethods
			}))
			if (newOrder.affected === 0) {
				logger.warn('加入失敗')
				res.status(400).json({
					message: '加入失敗'
				})
				return
			}
			const orderLinkProductRepository = dataSource.getRepository('order_link_products')
			const linkResult = await orderLinkProductRepository.insert(orders.map((order) => ({
				orders_id: newOrder.id,
				products_id: order.products_id,
				quantity: order.quantity,
				spec: order.spec,
				colors: order.colors
			})))
			if (linkResult.affected !== linkResult.length) {
				logger.warn('加入失敗')
				await orderRepository.delete({ id: newOrder.id })
				await orderLinkProductRepository.delete({ orders_id: newOrder.id })
				res.status(400).json({
					message: '加入失敗'
				})
				return
			}
			res.status(200).json({
				message: '加入成功'
			})
		} catch (error) {
			logger.error(error)
			next(error)
		}
	}
}
module.exports = OrderController
