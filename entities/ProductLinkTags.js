const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'product_link_tags',
  tableName: 'product_link_tags',
  columns: {
    products_id: {
      type: 'uuid',
      nullable: false,
      primary: true,
      primaryKeyConstraintName: 'product_link_tags_composite_pk'
    },
    product_tags_id: {
      type: 'uuid',
      nullable: false,
      primary: true,
      primaryKeyConstraintName: 'product_link_tags_composite_pk'
    }
  },
  relations: {
    products: {
      target: 'products',
      type: 'many-to-one',
      inverseSide: 'product_link_tags',
      joinColumn: {
        name: 'products_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'product_link_tags_fk_products'
      },
      cascade: false
    },
    product_tags: {
      target: 'product_tags',
      type: 'many-to-one',
      inverseSide: 'product_link_tags',
      joinColumn: {
        name: 'product_tags_id',
        referencedColumnName: 'id',
        foreignKeyConstraintName: 'product_link_tags_fk_product_tags'
      },
      cascade: false
    }
  }
})
