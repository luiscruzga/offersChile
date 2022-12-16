const Product = require('./models/products');

const saveProducts = async (products) => {
  if (products.length > 0) {
    try {
      // Remove duplicated products
      const productsNew = [...new Map(products.map(item => [item['name'], item])).values()]
      await Product.insertMany(productsNew);
    } catch (err) {
      console.log('ERROR: ', products.filter(el => isNaN(el.discountPercentage)), err.message);
    }
  }
}

const deleteProductsByVersion = async(store, version) => {
  await Product.deleteMany({store: store, version: {$lt : version}});
}

module.exports = {
  saveProducts,
  deleteProductsByVersion
}