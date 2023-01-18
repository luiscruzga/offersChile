const storeKey = 'adidas';
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
  const url = args.url.includes('?')
    ? `${args.url}&start=${STORES[storeKey].totalProductsPerPage * (args.page - 1)}`
    : `${args.url}?start=${STORES[storeKey].totalProductsPerPage * (args.page - 1)}`;
  try {
    const dom = await getDataUrl(url, {});
    const info = eval([...dom.window.document.getElementsByTagName('script')].find(el => el.text.includes('window.DATA_STORE')).text.replace('window.DATA_STORE =', '').trim());
    const productsInfo = [];
    const products = info.plp.itemList.items;
                  
    products.forEach(product => {
      const normalPrice = product.price;
      const offerPrice = product.price === product.salePrice ? 0 : product.salePrice;
      const href = product.link;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.productId,
        name: product.displayName,
        description: product.altText,
        brand: STORE_NAME,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: product.images.map(el => el.src),
        thumbnail: product.image.src,
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
    log.error(`[${STORE_NAME}][${url}]`, e);
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
    const dom = await getDataUrl(category.url, {});
    const totalPages = parseInt(dom.window.document.querySelector('[data-auto-id="pagination-pages-container"]').textContent.replace('de ', '').trim());
    return totalPages;
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}