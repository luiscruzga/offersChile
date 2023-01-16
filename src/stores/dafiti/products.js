const storeKey = 'dafiti';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, transformPrice } = require('../../utils/');
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
    const url = args.url.includes('?') ? `${args.url}&page=${args.page}` : `${args.url}?page=${args.page}`;
    const dom = await getDataUrl(url);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('#productsCatalog .card-content')]
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.original-price') 
        ? transformPrice(product.querySelector('.original-price').textContent)
        : transformPrice(product.querySelector('.discount-price').textContent);
      const offerPrice = product.querySelector('.original-price')
        ? transformPrice(product.querySelector('.discount-price').textContent)
        : 0;
      let image = product.querySelector('.itm-img').dataset.src;
      image = image.indexOf('http') !== -1 ? image : `${STORES[storeKey].baseUrl}${image}`;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.getAttribute('id'),
        name: product.querySelector('.itm-title').textContent,
        description: product.querySelector('.itm-title').textContent,
        brand: product.querySelector('.itm-brand').textContent,
        url: product.querySelector('.itm-link').href,
        images: [image],
        thumbnail: image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
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
    log.error(`[${STORE_NAME}][${args.url}?page=${args.page}]`, e);
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
    const totalProducts = parseInt(dom.window.document.querySelector('.search-query-results-count').textContent);
    return totalProducts < STORES[storeKey].totalProductsPerPage
      ? 1
      : Math.round(totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}