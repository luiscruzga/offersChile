const storeKey = 'beststore';
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
    const dom = await getDataUrl(`${args.url}?page=${args.page}`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('#js-product-list .products .product-miniature')]
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.regular-price') 
        ? transformPrice(product.querySelector('.regular-price').textContent)
        : transformPrice(product.querySelector('.price').textContent);
      const offerPrice = product.querySelector('.regular-price')
        ? transformPrice(product.querySelector('.price').textContent)
        : 0;

      productsInfo.push({
        store: STORE_NAME,
        sku: product.dataset.idProduct,
        name: product.querySelector('.product-title').textContent,
        description: product.querySelector('.product-title').textContent,
        brand: '',
        url: product.querySelector('.product-title').href,
        images: [...product.querySelectorAll('.product-thumbnail > img')].map(el => el.dataset.src),
        thumbnail: product.querySelector('.product-thumbnail > img').dataset.src
          ? product.querySelector('.product-thumbnail > img').dataset.src
          : product.querySelector('.product-thumbnail > img').src,
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
    const totalProducts = parseInt(dom.window.document.querySelector('.total-products p').textContent.replace('Hay ','').replace(' productos.').trim());
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