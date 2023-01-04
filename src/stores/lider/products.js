const storeKey = 'lider';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, replaceAll, axiosPost } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
const productsCount = STORES[storeKey].totalProductsPerPage;
let lastVersion = 1;

/**
 * Permite obtener los productos dada una categoria y página
 * @param {object} args
 * @param {string} args.url - url de la categoria
 * @param {number} args.page - pagina de la categoria
 * @param {object} args.category - category
 * @param {string} args.category.url - url de la categoria
 * @param {string} args.category.name - name de la categoria
 */
const getProductsByPage = async (args) => {
  try {
    const data = await axiosPost(STORES[storeKey].productsUrl, {
      categories: args.url.split('/').pop(),
      facets: [],
      hitsPerPage: productsCount,
      page: args.page,
      sortBy: 'discount_desc'
    });
    const productsInfo = [];
    const products = data.products;

    products.forEach(product => {
      productsInfo.push({
        store: STORE_NAME,
        sku: product.skuId,
        name: product.displayName,
        description: product.description,
        brand: product.brand,
        url: `https://www.lider.cl/catalogo/product/sku/${product.sku}/${product.slug}`,
        images: [product.images.defaultImage],
        thumbnail: product.images.defaultImage,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: product.discount,
        discount: (product.price.BasePriceReference - product.price.BasePriceSales),
        normalPrice: product.price.BasePriceReference,
        offerPrice: product.price.BasePriceSales,
        cardPrice: product.price.BasePriceTLMC,
        isOutOfStock: !product.available,
        isUnavailable: !product.makePublic,
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    return {
      category: args.category.name,
      products: [],
    };
  }
}
/**
 * Permite obtener el total de páginas de una categoria
 * @param  {string} url - URL de la categoria de la cual se desea obtener el total de páginas
 * @return {number}
 */
const getTotalPages = async (url) => {
  try {
    const data = await axiosPost(STORES[storeKey].productsUrl, {
      categories: url.split('/').pop(),
      facets: [],
      hitsPerPage: productsCount,
      page: 1,
      sortBy: 'discount_desc'
    });
    return Math.round(data.nbHits / productsCount);
  } catch (err) {
    return 1;
  }
}
/**
 * Permite orquestar la extracción de productos dada una lista de categorias, dichos productos son almacenados en la BD Mongo
 * @param  {[object]} categories - Lista de categorias
 */
const getAllProducts = async (categories) => {
  return new Promise(async (resolve,reject) => {
    const { version } = require('../../config/versions.json');
    lastVersion = version;
    deleteProductsByVersion(STORE_NAME, lastVersion);

    const productsInfo = [];
    let contPages = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      const totalPages = await getTotalPages(category.url);
      let pagesWithErrors = 0;
      let totalProducts = 0;
      log.info(`Category [${STORE_NAME}][${category.name}][${totalPages}]`);
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
          saveProducts(productsList.products);
          totalProducts += productsList.products.length;
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);        
      }

      await delay(3000);
      log.info(`Category [${STORE_NAME}][${category.name}] Total products: ${totalProducts}`);
    };

    await delay(2000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}