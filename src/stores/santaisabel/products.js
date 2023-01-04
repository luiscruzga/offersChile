const storeKey = 'santaisabel';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { axiosGet } = require('../../utils/');
const productsCount = STORES[storeKey].totalProductsPerPage;
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
    const data = await axiosGet(`${args.url}?page=${args.page}&sc=1`, {
      'x-api-key': 'IuimuMneIKJd3tapno2Ag1c1WcAES97j'
    });
    const productsInfo = [];
    const products = data.products;

    products.forEach(product => {
      let normalPrice = product.items[0].sellers[0].commertialOffer.PriceWithoutDiscount || 0;
      normalPrice = normalPrice || 0;
      let offerPrice = product.items[0].sellers[0].commertialOffer.Price || normalPrice;
      offerPrice = offerPrice || normalPrice;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.productId,
        name: product.productName,
        description: product.productName,
        brand: product.brand,
        url: `${STORES[storeKey].baseUrl}/${product.linkText}/p`,
        images: product.items[0].images.map(el => el.imageUrl),
        thumbnail: product.items[0].images[0].imageUrl,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: isNaN(100 - Math.round((offerPrice*100) / normalPrice)) ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: isNaN(normalPrice - offerPrice) ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
        isOutOfStock: product.items[0].sellers[0].commertialOffer.AvailableQuantity === 0 ? true : false,
        isUnavailable: product.items[0].sellers[0].commertialOffer.AvailableQuantity === 0 ? true : false,
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
    const data = await axiosGet(`${category.url}?page=1&sc=11`, {
      'x-api-key': 'IuimuMneIKJd3tapno2Ag1c1WcAES97j'
    });
    return Math.round((data.recordsFiltered || 0) / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}