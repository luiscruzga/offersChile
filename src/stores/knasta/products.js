const storeKey = 'knasta';
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
    const data = await axiosGet(`${STORES[storeKey].productsUrl}?category=${args.category.id}&page=${args.page}`);
    const productsInfo = [];
    const products = data.pageProps.initialData.products;

    products.forEach(product => {
      const normalPrice = product.last_variation_price != null ? product.last_variation_price : product.current_price;
      const offerPrice = product.last_variation_price != null ? product.current_price : 0;
      const cardPrice = product.price_card || 0;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.product_id,
        name: product.title,
        description: product.title,
        brand: product.brand,
        url: product.url,
        images: [product.image],
        thumbnail: product.image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: cardPrice !== 0
          ? (100 - Math.round((cardPrice*100) / normalPrice))
          : offerPrice !== 0
          ? (100 - Math.round((offerPrice*100) / normalPrice))
          : 0,
        discount: cardPrice !== 0
          ? (normalPrice - cardPrice)
          : offerPrice !== 0
          ? (normalPrice - offerPrice)
          : 0,
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
    log.error(`[${STORE_NAME}][${STORES[storeKey].productsUrl}?category=${args.category.id}&page=${args.page}]`, e);
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
    const data = await axiosGet(`${STORES[storeKey].productsUrl}?category=${category.id}`);
    return data.pageProps.initialData.total_pages;
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}