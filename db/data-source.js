const { DataSource } = require("typeorm");
const config = require("../config/index");

const Users = require("../entities/Users");
const Products = require("../entities/Products");
const ProductVariants = require("../entities/ProductVariants");
const ProductCategories = require("../entities/ProductCategories");
const ProductTags = require("../entities/ProductTags");
const ProductLinkTags = require("../entities/ProductLinkTags");
const Orders = require("../entities/Orders");
const OrderLinkProducts = require("../entities/OrderLinkProducts");
const PaymentMethods = require("../entities/PaymentMethods");
const PaymentStatuses = require("../entities/PaymentStatuses");





const dataSource = new DataSource({
	type: "postgres",
	host: config.get("db.host"),
	port: config.get("db.port"),
	username: config.get("db.username"),
	password: config.get("db.password"),
	database: config.get("db.database"),
	synchronize: config.get("db.synchronize"),
	poolSize: 10,
	entities: [Users, ProductCategories, ProductTags, Products, ProductVariants, ProductLinkTags, Orders, OrderLinkProducts, PaymentMethods, PaymentStatuses],
	ssl: config.get("db.ssl"),
});

module.exports = { dataSource };
