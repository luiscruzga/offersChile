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
    const dom = await getDataUrl(`${args.url}?page=${args.page}&cat=${args.category.id}`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.producto_single')];
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.tachado_dentro')
        ? transformPrice(product.querySelector('.tachado_dentro').textContent)
        : transformPrice(product.querySelector('.precio_actual').textContent);
      const offerPrice = product.querySelector('.precio_actual')
      ? transformPrice(product.querySelector('.precio_actual').textContent)
      : 0;
      
      productsInfo.push({
        store: STORE_NAME,
        sku: product.dataset.codpro,
        name: product.querySelector('.detalle_ropa p').textContent,
        description: product.querySelector('.detalle_ropa p').textContent,
        brand: STORE_NAME,
        url: product.querySelector('.main_link').href,
        images: [product.querySelector('.main_link img').src],
        thumbnail: product.querySelector('.main_link img').src,
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
    const pagination = [...dom.window.document.querySelectorAll('.paginator [data-page]')];
    return pagination.length > 0
      ? parseInt(pagination[pagination.length -2].dataset.page)
      : 1;
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}