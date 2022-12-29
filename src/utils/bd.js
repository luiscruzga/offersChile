const Product = require('./models/products');
const { bulkInsert, bulkDelete } = require('./pg');

const saveProducts = async (products) => {
  if (products.length > 0) {
    try {
      // Remove duplicated products
      const productsNew = [...new Map(products.map(item => [item['name'], item])).values()]
      if (process.env.MONGO_DB && process.env.MONGO_DB !== '') await Product.insertMany(productsNew);
      await bulkInsert(productsNew);
    } catch (err) {
      log.error('ERROR: ', products.filter(el => isNaN(el.discountPercentage)), err.message);
    }
  }
}

const deleteProductsByVersion = async(store, version) => {
  if (process.env.MONGO_DB && process.env.MONGO_DB !== '') await Product.deleteMany({store: store, version: {$lt : version}});
  await bulkDelete(store, version);
}

module.exports = {
  saveProducts,
  deleteProductsByVersion
}