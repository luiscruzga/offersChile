const storeKey = 'ripley';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl } = require('../../utils/');
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
    const dom = await getDataUrl(`${args.url}?page=${args.page}&orderBy=price_asc`);
    const productsInfo = [];
    const info = JSON.parse([...dom.window.document.getElementsByTagName('script')].find(el => el.text.includes('window.__PRELOADED_STATE__')).text.replace('window.__PRELOADED_STATE__ =', '').trim().slice(0,-1));
    let listProducts = [];
    listProducts = info.products;
                  
    listProducts.forEach(product => {
      productsInfo.push({
        store: STORE_NAME,
        sku: product.partNumber,
        name: product.name,
        description: product.longDescription,
        brand: product.manufacturer,
        url: product.url,
        images: product.images,
        thumbnail: product.thumbnail.indexOf('https') !== 0 ? product.thumbnail : `https:${product.thumbnail}`,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: product.prices.discountPercentage,
        discount: product.prices.discount,
        normalPrice: product.prices.listPrice,
        offerPrice: product.prices.offerPrice,
        cardPrice: product.prices.cardPrice,
        isOutOfStock: product.isOutOfStock,
        isUnavailable: product.isUnavailable,
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    log.error(`[${STORE_NAME}][${args.url}?page=${args.page}&orderBy=price_asc]`, e);
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
    const dom = await getDataUrl(category.url);
    const info = JSON.parse([...dom.window.document.getElementsByTagName('script')].find(el => el.text.includes('window.__PRELOADED_STATE__')).text.replace('window.__PRELOADED_STATE__ =', '').trim().slice(0,-1));
    return info.pagination ? info.pagination.totalPages : 1;
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}