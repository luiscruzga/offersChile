const { delay } = require('../utils/');
const { saveProducts, deleteProductsByVersion } = require('../utils/bd');
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT, MAX_TOTAL_PAGES } = require('../config/config.json');
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

    let totalProductsStore = 0;
    let contPages = 0;
    
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      let totalPages = await getTotalPages(category);
      let pagesWithErrors = 0;
      let productsCategory = [];
      let promises = [];
      log.info(`[${STORE_NAME}] Category [${STORE_NAME}][${category.name}][${totalPages}]`);
      totalPages = totalPages <= MAX_TOTAL_PAGES ? totalPages : MAX_TOTAL_PAGES;
      for (let page = 1; page <= totalPages; page++) {
        contPages++;
        if (pagesWithErrors >= 4) break;

        if (STORES[storeKey].delayByCategory) await delay(DELAY_TIME_DEFAULT);
        promises.push(getProductsByPage({
            url: category.url,
            page,
            category,
          })
          .then((productsList) => {
            if (productsList.products.length === 0) pagesWithErrors++;
            log.info(`[${STORE_NAME}][${category.name}(${categoryIndex+1} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
            productsCategory.push(...productsList.products);
          })
        );
        if (STORES[storeKey].delayByCategory && contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);        
      }

      await Promise.all(promises)
      .then(values => {
        // Remove duplicated products
        saveProducts(productsCategory);
        totalProductsStore += productsCategory.length;
        log.info(`[${STORE_NAME}] Category [${STORE_NAME}][${category.name}] Total products: ${productsCategory.length}`);
        productsCategory = [];
        promises = [];
        return true;
      });
      if (STORES[storeKey].delayByCategory) await delay(DELAY_TIME);
    };

    resolve(totalProductsStore);
  });
}

module.exports = {
  getAllProducts
}