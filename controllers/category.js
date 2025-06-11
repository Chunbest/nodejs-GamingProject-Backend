const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CategoryController')

class CategoryController {
	static async postCategories(req, res, next) {
		try {
			const { name, description } = req.body;
			const categoryRepository = await dataSource.getRepository('product_categories')
			const newCategories = await categoryRepository.create({
				name,
				description
			})
			const saveCategories = await categoryRepository.save(newCategories)

			res.status(200).json({
				message: '新增產品分類成功',
				data: saveCategories
			})
		} catch (error) {
			logger.error(error)
			next(error)
		}
	}

	static async getCategories(req, res, next) {
		try {
			const categories = await dataSource.getRepository('product_categories').find({
				select: ['id', 'name', 'description']
			})
			res.status(200).json({
				message: '成功',
				data: categories
			})
		} catch (error) {
			logger.error(error)
			next(error)
		}
	}
}
module.exports = CategoryController
