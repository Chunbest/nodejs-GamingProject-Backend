// 引入資料庫連線設定
const { dataSource } = require("../db/data-source");

// 引入 TypeORM 的 IsNull，用於查詢條件
const { IsNull } = require("typeorm");

// 建立 logger（方便除錯時追蹤 log）
const logger = require("../utils/logger")("ProductsController");

// 自訂驗證工具函式（字串、UUID格式、是否查無資料）
const { isNotValidString, isValidUUID, isNotFound } = require("../utils/validator");

// 數字正規表達式（只允許整數）
const numberReg = /^[0-9]+$/;

// 檢查是否為 undefined（工具函式）
function isUndefined(value) {
	return value === undefined;
}

class ProductsController {

	// 📦 取得商品列表
	static async getProducts(req, res, next) {
		try {
			// 解構取得查詢參數：頁數與分類名稱，若未提供則給預設值
			const { page = 1, category = "" } = req.query;

			// 驗證 page 是否為有效正整數、category 是否為字串
			if (
				!numberReg.test(page) || // page 不是純數字
				page < 1 || // page 不能小於 1
				page % 1 !== 0 || // page 不能是小數
				typeof category !== "string" // category 必須是字串
			) {
				res.status(400).json({
					message: "頁數輸入錯誤",
				});
				return;
			}

			logger.debug(`category: ${category}`);

			const pageToInt = parseInt(page, 10); // 轉成數字
			const perPage = 10; // 每頁顯示數量
			const skip = (pageToInt - 1) * perPage; // 計算跳過多少筆資料

			let productCategory;

			// 若有提供分類名稱，則查詢分類 id
			if (category !== "") {
				productCategory = await dataSource
					.getRepository("product_categories")
					.findOne({
						select: ["id"],
						where: { name: category },
					});

				// 若找不到分類，回傳錯誤
				if (!productCategory) {
					res.status(400).json({
						message: "找不到該分類",
					});
					return;
				}
			}

			// 建立查詢條件：deleted_at 為 null 表示尚未被刪除
			const productWhereOptions = {
				deleted_at: IsNull(),
			};

			// 若指定分類則加入條件
			if (productCategory) {
				productWhereOptions.product_categories_id = productCategory.id;
			}

			// 查詢商品資料（含關聯的分類名稱）
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
					product_categories: { name: true },
				},
				where: productWhereOptions,
				relations: {
					product_categories: true,
				},
				order: {
					created_at: "DESC", // 依照建立時間由新到舊
				},
				take: perPage, // 取得筆數限制
				skip, // 跳過前面幾筆
			});

			logger.debug(`products: ${JSON.stringify(products, null, 1)}`);

			// 計算總筆數（分頁用）
			const total = await dataSource.getRepository("products").count({
				where: productWhereOptions,
			});

			// 回傳商品資料與分頁資訊
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
			// 發生錯誤則記錄並交由全域錯誤處理
			logger.error(error);
			next(error);
		}
	}

	// 🧾 取得商品詳細資料
	static async getProductDetail(req, res, next) {
		try {
			// 從路由參數取得商品 id
			const { products_id: productId } = req.params;

			// 驗證 id 是否為有效字串與 UUID 格式
			if (isUndefined(productId) || isNotValidString(productId) || productId === null) {
				res.status(400).json({
					status: "failed",
					message: "欄位未填寫正確",
				});
				return;
			}

			if (!isValidUUID(productId)) {
				res.status(400).json({
					status: "failed",
					message: "找不到商品",
				});
				return;
			}

			// 查詢商品詳細資訊（包含關聯分類）
			const productDetail = await dataSource.getRepository("products").findOne({
				select: {
					id: true,
					name: true,
					description: true,
					image_url: true,
					origin_price: true,
					price: true,
					enable: true,
					product_categories: { name: true },
				},
				where: { id: productId },
				relations: {
					product_categories: true,
				},
			});

			// 若查無資料或關聯分類，回傳 404
			if (isNotFound(productDetail) || isNotFound(productDetail.product_categories)) {
				res.status(404).json({
					status: "failed",
					message: "找不到商品",
				});
				return;
			}

			// 查詢商品變體（顏色、數量、規格等）
			const productVariants = await dataSource.getRepository("product_variants").findOne({
				select: {
					id: true,
					products_id: true,
					colors: true,
					spec: true,
					quantity: true,
				},
				where: { products_id: productId },
				relations: {
					products_id: true,
				},
			});

			if (productVariants) {
				console.log(productVariants.id);
			}

			// 查詢商品對應的標籤（多對多關聯）
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

			// 紀錄查詢結果（方便後續除錯）
			logger.info(`productDetail: ${JSON.stringify(productDetail, null, 1)}`);
			logger.info(`productLinkTag: ${JSON.stringify(productLinkTag, null, 1)}`);
			logger.info(`productVariants: ${JSON.stringify(productVariants, null, 1)}`);

			// 整理回傳格式
			res.status(200).json({
				status: "success",
				message: "取得商品詳細成功",
				data: {
					products: {
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
					variants: productVariants
						? {
							id: productVariants.id,
							colors: productVariants.colors,
							size: productVariants.size, // ✅ 若有 size 欄位才顯示
							quantity: productVariants.quantity,
							spec: productVariants.spec,
						}
						: null,
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


// 匯出 Controller 給路由使用
module.exports = ProductsController;
