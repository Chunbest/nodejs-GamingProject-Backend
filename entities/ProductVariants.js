const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
	name: "product_variants",
	tableName: "product_variants",
	columns: {
		id: {
			primary: true,
			type: "int", // 自動遞增的整數
			nullable: false,
			comment: "主鍵，自動遞增",
		},
		products_id: {
			type: "uuid",
			nullable: false,
			comment: "對應商品的ID",
			// 這裡可以加上關聯設定
		},
		colors: {
			type: "varchar",
			length: 100,
			nullable: false,
			comment: "顏色",
		},
		size: {
			type: "text",
			nullable: true, // 可選填
			comment: "尺寸, 可選填",
		},
		quantity: {
			type: "integer",
			nullable: false,
			default: 0,
			comment: "庫存數量",
		},
		spec: {
			type: "varchar",
			length: 100,
			nullable: true, // 可選填
			comment: "規格, 可選填",
		},
		created_at: {
			type: "timestamp",
			nullable: false,
			default: () => "CURRENT_TIMESTAMP",
			// 使用當前時間
		},
		updated_at: {
			type: "timestamp",
			nullable: false,
			default: () => "CURRENT_TIMESTAMP",
			// 使用當前時間
		},
		deleted_at: {
			type: "timestamp",
			nullable: true,
		},
	},
	relations: {
		products_id: {
			target: "products",
			type: "many-to-one",
			joinColumn: {
				name: "products_id",
				referencedColumnName: "id",
				foreignKeyConstraintName: "products_fk_products_id",
			},
		},
	},
});
