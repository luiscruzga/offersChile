const storeKey = 'falabella';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, replaceAll } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
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
    const dom = await getDataUrl(`${args.url}?isPLP=1&page=${args.page}`, true);
    const productsInfo = [];
    const products = JSON.parse(dom.window.document.getElementById('__NEXT_DATA__').textContent).props.pageProps.results;

    products.forEach(product => {
      const cardPrice = product.prices.find(el => el.type === 'cmrPrice') ? parseInt(replaceAll(product.prices.find(el => el.type === 'cmrPrice').price[0], '.', '')) : 0;
      const offerPrice = product.prices.find(el => el.type === 'internetPrice')
        ? parseInt(replaceAll(product.prices.find(el => el.type === 'internetPrice').price[0], '.', '')) 
        : product.prices.find(el => el.type === 'eventPrice')
        ? parseInt(replaceAll(product.prices.find(el => el.type === 'eventPrice').price[0], '.', '')) 
        : 0;
      let normalPrice = product.prices.find(el => el.type === 'normalPrice') ? parseInt(replaceAll(product.prices.find(el => el.type === 'normalPrice').price[0], '.', '')) : 0;
      normalPrice = normalPrice === 0 ? offerPrice : normalPrice;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.skuId,
        name: product.displayName,
        description: product.displayName,
        brand: product.brand,
        url: product.url,
        images: product.mediaUrls,
        thumbnail: '',
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: cardPrice !== 0
          ? (100 - Math.round((cardPrice*100) / normalPrice))
          : offerPrice !== 0
          ? (100 - Math.round((offerPrice*100) / normalPrice))
          : 0,
        discount: cardPrice !== 0
          ? (normalPrice - cardPrice)
          : offerPrice !== 0
          ? (normalPrice - offerPrice)
          : 0,
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: cardPrice,
        isOutOfStock: false,
        isUnavailable: false,
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
    const dom = await getDataUrl(url, true);
    const pagination = JSON.parse(dom.window.document.getElementById('__NEXT_DATA__').textContent).props.pageProps.pagination;
    return Math.round(pagination.count / pagination.perPage);
  } catch (err) {
    log.error('ERROR', err);
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
    let contTotalPages = 0;
    let contCategory = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      contCategory++;
      const totalPages = await getTotalPages(category.url);
      contTotalPages += totalPages;
      let productsCategory = [];
      let pagesWithErrors = 0;
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
          productsCategory.push(...productsList.products);
          log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);
      }

      await delay(3000);
      saveProducts(productsCategory);
      log.info(`Category [${STORE_NAME}][${category.name}] Total products: ${productsCategory.length}`);
      productsCategory = [];
    };

    await delay(2000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}