const storeKey = 'falabella';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, replaceAll } = require('../../utils/');
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
    log.error(`[${STORE_NAME}][${args.url}?isPLP=1&page=${args.page}]`, e);
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
const getTotalPages = async (category) => {
  try {
    const dom = await getDataUrl(category.url, true);
    const pagination = JSON.parse(dom.window.document.getElementById('__NEXT_DATA__').textContent).props.pageProps.pagination;
    return Math.round(pagination.count / pagination.perPage);
  } catch (err) {
    log.error('ERROR', err);
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}