const storeKey = 'tricot';
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
    const dom = await getDataUrl(`${args.url}?start=${(args.page-1)*STORES[storeKey].totalProductsPerPage}&sz=${STORES[storeKey].totalProductsPerPage}`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.product-tile-wrapper')];
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.price .tri-tile-price-red .value')
        ? parseInt(product.querySelector('.strike-through').getAttribute('content'))
        : transformPrice(product.querySelector('.price .tri-tile-price-red .value').textContent.trim());
      const offerPrice = product.querySelector('.price .tri-tile-price-red .value')
      ? transformPrice(product.querySelector('.price .tri-tile-price-red .value').textContent.trim())
      : 0;
      const href = product.querySelector('.tri-product-tile-name').href;
      const infoProduct = JSON.parse(product.querySelector('.tri-product-tile-name').dataset.cbt);
      productsInfo.push({
        store: STORE_NAME,
        sku: infoProduct.ecommerce.click.products[0].id,
        name: infoProduct.ecommerce.click.products[0].name,
        description: infoProduct.ecommerce.click.products[0].name,
        brand: infoProduct.ecommerce.click.products[0].brand,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: [product.querySelector('.tile-image').src],
        thumbnail: product.querySelector('.tile-image').src,
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
    log.error(`[${STORE_NAME}][${args.url}?page=${args.page}&cat=${args.category.id}]`, e);
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
    const totalProducts = parseInt(dom.window.document.querySelector('.products-quantity').textContent);
    return totalProducts <= STORES[storeKey].totalProductsPerPage
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