const storeKey = 'entel';
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
    const dom = await getDataUrl(`${args.url}?p=${args.page}`);
    const productsInfo = [];
    const data = JSON.parse(dom.window.document.getElementById('rootProductInfo_JSON').textContent.split("</var>")[0]);
    const products = data.main.find(el => el['@type'] === 'equipmentListCampaigns').records;
                  
    products.forEach(product => {
      const normalPrice = product.attributes.referencePriceFormatted !== null && product.attributes.referencePriceFormatted.length > 0
        ? transformPrice(product.attributes.referencePriceFormatted[0])
        : transformPrice(product.attributes.priceFormatted[0]);
      const offerPrice = product.attributes.referencePriceFormatted !== null && product.attributes.referencePriceFormatted.length > 0
        ? transformPrice(product.attributes.priceFormatted[0])
        : 0;
      let image = product.attributes.productImage[0];
      image = image.indexOf('http') !== -1 ? image : `${STORES[storeKey].baseUrl}${image}`;
      const href = product.attributes.seoUrl[0];
      productsInfo.push({
        store: STORE_NAME,
        sku: product.attributes.sku[0],
        name: product.attributes.displayName[0],
        description: product.attributes.description[0],
        brand: product.attributes.brand[0],
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: [image],
        thumbnail: image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
        isOutOfStock: product.attributes.inventoryStatus[0] === 'IN_STOCK' ? false : true,
        isUnavailable: product.attributes.inventoryStatus[0] === 'IN_STOCK' ? false : true,
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
    const dom = await getDataUrl(category.url);
    const data = JSON.parse(dom.window.document.getElementById('rootProductInfo_JSON').textContent.split("</var>")[0]);
    const totalProducts = data.main.find(el => el['@type'] === 'equipmentListCampaigns').totalNumRecs;
    const totalPerPage = data.main.find(el => el['@type'] === 'equipmentListCampaigns').recsPerPage || STORES[storeKey].totalProductsPerPage;
    return totalProducts < totalPerPage
      ? 1
      : Math.round(totalProducts / totalPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}