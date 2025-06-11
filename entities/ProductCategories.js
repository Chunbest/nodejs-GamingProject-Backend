const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'product_categories',
  tableName: 'product_categories',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true
    },
     description: {
      type: 'varchar',
      length: 50,
      nullable: true,
      unique: true
    },
	  
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
      nullable: false
    },
    deleted_at: {
      type: 'timestamp',
      nullable: true
    }
  }
})
