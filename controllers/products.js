const { dataSource } = require("../db/data-source");
const { IsNull } = require("typeorm");
const logger = require("../utils/logger")("ProductsController");

const numberReg = /^[0-9]+$/;

function isUndefined(value) {
	return value === undefined;
}

function isNotValidSting(value) {
	return typeof value !== "string" || value.trim().length === 0 || value === "";
}

class ProductsController {
	static async getProducts(req, res, next) {
		try {
			const { page = 1, category = "" } = req.query;
			if (
				!numberReg.test(page) ||
				page < 1 ||
				page % 1 !== 0 ||
				typeof category !== "string"
			) {
				res.status(400).json({
					message: "頁數輸入錯誤",
				});
				return;
			}
			logger.debug(`category: ${category}`);
			const pageToInt = parseInt(page, 10);
			const perPage = 10;
			const skip = (pageToInt - 1) * perPage;
			let productCategory;
			if (category !== "") {
				productCategory = await dataSource
					.getRepository("product_categories")
					.findOne({
						select: ["id"],
						where: {
							name: category,
						},
					});
				if (!productCategory) {
					res.status(400).json({
						message: "找不到該分類",
					});
					return;
				}
			}
			const productWhereOptions = {
				deleted_at: IsNull(),
			};
			if (productCategory) {
				productWhereOptions.product_categories_id = productCategory.id;
			}
			const products = await dataSource.getRepository("products").find({
				select: {
					id: true,
					name: true,
					description: true,
					image_url: true,
					origin_price: true,
					price: true,
					created_at: true,
					is_hot: true,
					product_categories: {
						name: true,
					},
				},
				where: productWhereOptions,
				relations: {
					product_categories: true,
				},
				order: {
					created_at: "DESC",
				},
				take: perPage,
				skip,
			});
			logger.debug(`products: ${JSON.stringify(products, null, 1)}`);
			const total = await dataSource.getRepository("products").count({
				where: productWhereOptions,
			});
			res.status(200).json({
				message: "取得商品成功",
				data: {
					pagination: {
						current_page: pageToInt,
						total_page: Math.ceil(total / perPage),
					},
					products: products.map(
						({
							id,
							name,
							description,
							image_url: imageUrl,
							origin_price: originPrice,
							price,
							product_categories: productCategories,
							is_hot,
						}) => ({
							id,
							name,
							category: productCategories.name,
							description,
							image_url: imageUrl,
							origin_price: originPrice,
							price,
							is_hot,
						})
					),
				},
			});
		} catch (error) {
			logger.error(error);
			next(error);
		}
	}

	static async getProductDetail(req, res, next) {
		try {
			const { products_id: productId } = req.params;
			if (isUndefined(productId) || isNotValidSting(productId)) {
				res.status(400).json({
					message: "欄位未填寫正確",
				});
				return;
			}
			const productDetail = await dataSource.getRepository("products").findOne({
				select: {
					id: true,
					name: true,
					description: true,
					image_url: true,
					origin_price: true,
					price: true,
					enable: true,
					product_categories: {
						name: true,
					},
				},
				where: { id: productId },
				relations: {
					product_categories: true,
				},
			});
			const productVariants = await dataSource.getRepository("product_variants").findOne({
				select: {
					id: true,
					products_id: true,
					colors: true,
					spec: true,
					quantity: true,
				},
				// product_variants 資料表中 products_id欄位 = productId 的那一筆
				where: { products_id: productId },
				relations: {
					products_id: true,
				},
			});
			const productLinkTag = await dataSource
				.getRepository("product_link_tags")
				.find({
					select: {
						product_tags: {
							id: true,
							name: true,
						},
					},
					where: { products_id: productId },
					relations: {
						product_tags: true,
					},
				});
			logger.info(`productDetail: ${JSON.stringify(productDetail, null, 1)}`);
			logger.info(`productLinkTag: ${JSON.stringify(productLinkTag, null, 1)}`);
			logger.info(`productVariants: ${JSON.stringify(productVariants, null, 1)}`);
			res.status(200).json({
				status: "success",
				message: "取得商品詳細成功",
				data: {
					produts: {
						id: productDetail.id,
						name: productDetail.name,
						category: productDetail.product_categories.name,
						origin_price: productDetail.origin_price,
						price: productDetail.price,
						description: productDetail.description,
					},
					images: {
						image_url: productDetail.image_url,
					},
					variants: {						
						colors: productVariants.colors,
						size: productVariants.size,
						quantity: productVariants.quantity,
						spec: productVariants.spec
					},
					tags: productLinkTag.map(
						({ product_tags: productTags }) => productTags
					),
				},
			});
		} catch (error) {
			logger.error(error);
			next(error);
		}
	}
}
module.exports = ProductsController;
