const { delay } = require('../utils/');
const { saveProducts, deleteProductsByVersion } = require('../utils/bd');
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../config/config.json');
let lastVersion = 1;

/**
 * Permite orquestar la extracción de productos dada una lista de categorias, dichos productos son almacenados en la BD Mongo
 * @param  {[object]} categories - Lista de categorias
 */
const getAllProducts = async (storeKey, categories, getTotalPages, getProductsByPage) => {
  return new Promise(async (resolve,reject) => {
    const STORE_NAME = STORES[storeKey].name;
    const { version } = require('../config/versions.json');
    lastVersion = version;
    deleteProductsByVersion(STORE_NAME, lastVersion);

    const productsInfo = [];
    let contPages = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      const totalPages = await getTotalPages(category);
      let pagesWithErrors = 0;
      let totalProducts = 0;
      let productsCategory = [];
      log.info(`[${STORE_NAME}]Category [${STORE_NAME}][${category.name}][${totalPages}]`);
      for (let page = 1; page <= totalPages; page++) {
        contPages++;
        if (pagesWithErrors >= 4) break;

        await delay(DELAY_TIME_DEFAULT);
        getProductsByPage({
          url: category.url,
          page,
          category,
        })
        .then((productsList) => {
          if (productsList.products.length === 0) pagesWithErrors++;
          log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
          productsCategory.push(...productsList.products);
          totalProducts += productsList.products.length;
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);        
      }

      await delay(3000);
      saveProducts(productsCategory);
      log.info(`[${STORE_NAME}] Category [${STORE_NAME}][${category.name}] Total products: ${totalProducts}`);
      productsCategory = [];
    };

    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts
}