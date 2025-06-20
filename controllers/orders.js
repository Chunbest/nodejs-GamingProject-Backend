const { dataSource } = require('../db/data-source')
const { In } = require('typeorm')
const logger = require('../utils/logger')('OrderController')
const { isNotValidString } = require('../utils/validator')

function isUndefined(value) {
	return value === undefined
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
			isNotValidString(element.products_id) ||
			isNotValidInteger(element.quantity) ||
			isNotValidString(element.spec) ||
			isNotValidString(element.colors)) {
			return true
		}
	}
	return false
}

class OrderController {
	static async postOrder(req, res, next) {
		try {
			// 定義驗證用的正規表示式
			const userNameReg = /^[\p{L}\p{N}]{2,50}$/u // 驗證使用者姓名格式
			const telReg = /^09\d{8}$/ // 驗證台灣手機號碼格式
			const paymentMethodReg = /^[1-3]$/ // 驗證付款方式 ID

			// 從 request body 中解構出訂單資料
			const { user, orders, payment_methods: paymentMethods } = req.body

			// 驗證傳入的資料格式是否正確
			if (isUndefined(user) || !Object.prototype.hasOwnProperty.call(user, 'name') ||
				!Object.prototype.hasOwnProperty.call(user, 'tel') ||
				!Object.prototype.hasOwnProperty.call(user, 'address') ||
				isNotValidString(user.name) || !userNameReg.test(user.name) ||
				isNotValidString(user.tel) || !telReg.test(user.tel) ||
				isNotValidString(user.address) || user.address.length > 30 ||
				isNotValidOrder(orders) ||
				isNotValidInteger(paymentMethods) || !paymentMethodReg.test(paymentMethods)) {
				logger.warn('欄位未填寫正確')
				res.status(400).json({
					message: '欄位未填寫正確'
				})
				return
			}
			const { id } = req.user

			// --- 計算價格 ---
			const productRepository = dataSource.getRepository('products')
			const productIds = orders.map(o => o.products_id)
			const productsInDB = await productRepository.find({ where: { id: In(productIds) } })

			if (productsInDB.length !== productIds.length) {
				logger.warn('部分產品 ID 不存在')
				return res.status(400).json({ message: '部分產品 ID 不存在' })
			}

			const productMap = productsInDB.reduce((map, p) => {
				map[p.id] = p
				return map
			}, {})
			let originalPrice = 0
			let discountedPrice = 0
			for (const order of orders) {
				const product = productMap[order.products_id]
				if (product) {
					// 使用資料庫中的 origin_price 作為原始價格
					const itemOriginalPrice = product.origin_price * order.quantity
					originalPrice += itemOriginalPrice
					// 使用資料庫中的 price 作為折扣後價格
					const itemDiscountedPrice = product.price * order.quantity
					discountedPrice += itemDiscountedPrice

					// Debug 資訊
					logger.info(`商品 ${product.name}: origin_price=${product.origin_price}, price=${product.price}, quantity=${order.quantity}, itemOriginalPrice=${itemOriginalPrice}, itemDiscountedPrice=${itemDiscountedPrice}`)
				}
			}
			const totalDiscount = originalPrice - discountedPrice
			logger.info(`總計: originalPrice=${originalPrice}, discountedPrice=${discountedPrice}, totalDiscount=${totalDiscount}`)
			const deliveryFee = 60 // 運費應由後端邏輯決定
			const totalPrice = discountedPrice + deliveryFee

			// --- 取得關聯資料 ---
			const paymentMethodRepo = dataSource.getRepository('payment_methods')
			const paymentMethod = await paymentMethodRepo.findOneBy({ id: paymentMethods })


			const orderRepository = dataSource.getRepository('orders')
			const newOrder = await orderRepository.save(orderRepository.create({
				users_id: id,
				name: user.name,
				tel: user.tel,
				address: user.address,
				is_paid: false,
				payment_methods_id: paymentMethods,
				// 新訂單的狀態應由後端設定
				order_statuses_id: 1, // 假設 1 = 處理中
				payment_statuses_id: 1 // 假設 1 = 未付款
			}))

			if (!newOrder) {
				logger.warn('建立訂單失敗')
				return res.status(400).json({ message: '建立訂單失敗' })
			}

			const orderLinkProductRepository = dataSource.getRepository('order_link_products')
			const linkResult = await orderLinkProductRepository.insert(orders.map((order) => ({
				orders_id: newOrder.id,
				products_id: order.products_id,
				quantity: order.quantity,
				spec: order.spec,
				colors: order.colors
			})))
			if (linkResult.generatedMaps.length !== orders.length) {
				logger.warn('寫入訂單商品關聯失敗')
				await orderRepository.delete({ id: newOrder.id })
				await orderLinkProductRepository.delete({ orders_id: newOrder.id })
				res.status(400).json({
					message: '加入失敗'
				})
				return
			}
			res.status(200).json({
				status: 'success',
				message: '加入訂單成功',
				data: {
					order_id: newOrder.id,
					payment_methods_label: paymentMethod ? paymentMethod.label : 'N/A',
					payment_statuses_label: '未付款', // 新訂單狀態由後端決定
					order_statuses_label: '處理中', // 新訂單狀態由後端決定
					original_price: originalPrice,
					price: discountedPrice,
					discount: totalDiscount, // 總折扣金額
					delivery_fee: deliveryFee,
					total_price: totalPrice,
					created_at: newOrder.created_at
				}
			})
		} catch (error) {
			logger.error(error)
			next(error)
		}
	}
}
module.exports = OrderController
