const storeKey = 'movistar';
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
    const dom = await getDataUrl(`${args.url}?p=${args.page}`, true);
    const productsInfo = [];
    const products = dom.window.products;
                  
    products.forEach(product => {
      const normalPrice = dom.window.document.querySelector(`.product-item-link[data-crosss-id-catalog="${product.id}"] .precio_normal .price`)
        ? transformPrice(dom.window.document.querySelector(`.product-item-link[data-crosss-id-catalog="${product.id}"] .precio_normal .price`).textContent)
        : product.price;
      const offerPrice = normalPrice === product.price ? 0 : product.price;
      let image = dom.window.document.querySelector(`.product-item-photo[data-crosss-id-catalog="${product.id}"] .product-image-photo`).src;
      image = image.indexOf('http') !== -1 ? image : `${STORES[storeKey].baseUrl}${image}`;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.id,
        name: product.name,
        description: product.name,
        brand: product.brand,
        url: dom.window.document.querySelector(`.product-item-link[data-crosss-id-catalog="${product.id}"]`).href,
        images: [image],
        thumbnail: image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
        isOutOfStock: dom.window.document.querySelector(`.product-item-photo[data-crosss-id-catalog="${product.id}"]`).parentElement.classList.contains('sin-stock'),
        isUnavailable: dom.window.document.querySelector(`.product-item-photo[data-crosss-id-catalog="${product.id}"]`).parentElement.classList.contains('sin-stock'),
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    log.error(`[${STORE_NAME}][${args.url}?p=${args.page}]`, e);
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
    const totalProducts = parseInt(dom.window.document.querySelector('.toolbar-number').textContent.trim().split(' ').pop());
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