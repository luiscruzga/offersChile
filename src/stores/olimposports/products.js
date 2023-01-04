const storeKey = 'olimposports';
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
    const dom = await getDataUrl(`${args.url}/page/${args.page}/`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.products .product')];
                  
    products.forEach(product => {
      const normalPrice = product.querySelectorAll('.woocommerce-Price-currencySymbol').length > 1
        ? transformPrice([...product.querySelectorAll('.woocommerce-Price-amount')][0].textContent)
        : transformPrice(product.querySelector('.woocommerce-Price-amount').textContent);
      const offerPrice = product.querySelectorAll('.woocommerce-Price-currencySymbol').length > 1
        ? transformPrice([...product.querySelectorAll('.woocommerce-Price-amount')][1].textContent)
        : 0;
      let image = product.querySelector('.attachment-woocommerce_thumbnail').src;
      image = image.indexOf('http') !== -1 ? image : `${STORES[storeKey].baseUrl}${image}`;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.querySelector('[data-product_id]').dataset.product_id,
        name: product.querySelector('.woocommerce-loop-product__title').textContent,
        description: product.querySelector('.woocommerce-loop-product__title').textContent,
        brand: '',
        url: product.querySelector('.woocommerce-LoopProduct-link').href,
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
    log.error(STORE_NAME, e);
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
    return category.totalProducts < STORES[storeKey].totalProductsPerPage
      ? 1
      : Math.round(category.totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}