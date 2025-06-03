const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
	name: 'payment_statuses',
	tableName: 'payment_statuses',
	columns: {
		id: {
			primary: true,
			type: 'int',
			generated: 'increment',
		},
		code: {
			type: 'varchar',
			length: 50,
			unique: true,
			nullable: false,
		},
		label: {
			type: 'varchar',
			length: 100,
			nullable: false,
		},
		is_active: {
			type: 'boolean',
			nullable: false,
			default: true,
		},
	},
});
