const storeKey = 'paris';
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
    const totalProductsPerPage = STORES[storeKey].totalProductsPerPage;
    const url = args.url.includes('?') ? `${args.url}&start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}` : `${args.url}?start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}`;
    const dom = await getDataUrl(url, true);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.product-tile[data-product]')];

    products.forEach(el => {
      const product = JSON.parse(el.dataset.product);
      product.url = el.querySelector('a').href;

      const images = [...el.querySelectorAll('img[itemprop="image"]')].map(img => img.dataset.src);
      const cardPrice = product.dimension20 === '' ? 0 : parseInt(product.dimension20);
      const offerPrice = product.dimension20 === '' ? 0 : parseInt(product.dimension20);
      const internetPrice = parseInt(product.price);
      let normalPrice = product.dimension19 === '' ? 0 : parseInt(product.dimension19);
      normalPrice = normalPrice === 0 ? offerPrice : normalPrice;
      const href = product.url;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.id,
        name: product.name,
        description: product.name,
        brand: product.brand,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: images,
        thumbnail: images[0],
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
        offerPrice: internetPrice !== 0 ? internetPrice : offerPrice,
        cardPrice: cardPrice,
        isOutOfStock: product.dimension21 === 'True' ? false : true,
        isUnavailable: product.dimension21 === 'True' ? false : true,
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    const totalProductsPerPage = STORES[storeKey].totalProductsPerPage;
    log.error(`[${STORE_NAME}][${args.url}?start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}]`, e);
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
    const totalProducts = parseInt(replaceAll(dom.window.document.querySelector('.total-products > span').textContent, '\n', ''));
    return Math.round(totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}