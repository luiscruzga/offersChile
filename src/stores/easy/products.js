const storeKey = 'easy';
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
    const dom = await getDataUrl(`${args.url}?page=${args.page}`);
    const productsInfo = [];
    const productsJson = JSON.parse(dom.window.document.querySelector('[data-varname="__STATE__"]').content.children[0].text);
    const products = [];
    for (let key in productsJson) {
      if (key.includes('Product:sp-') && key.indexOf('.') === -1) {
        products.push(productsJson[key]);
      }
    }

    products.forEach(product => {
      const itemsId = product['items({"filter":"ALL_AVAILABLE"})'][0].id;
      const images = [];
      productsJson[itemsId].images.forEach(el => {
        images.push(productsJson[el.id].imageUrl);
      });
      const priceRange = productsJson[product.priceRange.id];

      const cardPrice = 0;
      const offerPrice = productsJson[priceRange.sellingPrice.id].lowPrice || 0;
      let normalPrice = productsJson[priceRange.listPrice.id].lowPrice || 0;

      productsInfo.push({
        store: STORE_NAME,
        sku: product.productId,
        name: product.productName,
        description: product.description,
        brand: product.brand,
        url: `${STORES[storeKey].baseUrl}${product.link}`,
        images: images,
        thumbnail: images[0],
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
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
    const productsJson = JSON.parse(dom.window.document.querySelector('[data-varname="__STATE__"]').content.children[0].text);
    let totalProducts = 0;
    for (let key in productsJson['ROOT_QUERY']) {
      if (key.includes('productSearch')) totalProducts = productsJson[productsJson['ROOT_QUERY'][key].id].recordsFiltered;
    }

    return Math.round(totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}