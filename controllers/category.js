const { dataSource } = require('../db/data-source')
const logger = require('../utils/logger')('CategoryController')

class CategoryController {
  static async getCategories (req, res, next) {
    try {
      const categories = await dataSource.getRepository('product_categories').find({
        select: ['id', 'name']
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
