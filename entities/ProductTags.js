const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'product_tags',
  tableName: 'product_tags',
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
  },
  relations: {
    product_link_tags: {
      target: 'product_link_tags',
      type: 'one-to-many',
      inverseSide: 'product_tags',
      joinColumn: {
        name: 'id',
        referencedColumnName: 'product_tags_id',
        foreignKeyConstraintName: 'product_tags_fk_product_link_tags'
      },
      cascade: false
    }
  }
})
