const storeKey = 'wom';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { axiosGet, transformPrice, replaceAll } = require('../../utils/');
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
    const data = await axiosGet(STORES[storeKey].productsUrl.replace('**PAGE**', args.page).replace('**CATEGORY_ID**', args.category.id));
    const productsInfo = [];
    const products = data.items;
                  
    products.forEach(product => {
      const normalPrice = product.prices_array.full_price !== null && product.prices_array.full_price !== transformPrice(product.Precio)
        ? product.prices_array.full_price
        : transformPrice(product.Precio);
      const offerPrice = product.prices_array.full_price !== null && product.prices_array.full_price !== transformPrice(product.Precio)
        ? transformPrice(product.Precio)
        : 0;
      const image = `${STORES[storeKey].baseUrl}/content/product/${product.sku}/images/defalut.png`;
      
      productsInfo.push({
        store: STORE_NAME,
        sku: product.sku,
        name: product.name,
        description: product.meta_description,
        brand: product.marca,
        url: `${STORES[storeKey].baseUrl}/equipos/${product.sku}/${replaceAll(product.name, ' ', '-')}`,
        images: [image],
        thumbnail: image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
        isOutOfStock: product.is_sellable === '1' && (!product.qty || (product.qty && product.qty > 0)) ? false : true,
        isUnavailable: product.visibility === '1' ? false : true,
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    log.error(`[${STORE_NAME}][${STORES[storeKey].productsUrl.replace('**PAGE**', args.page).replace('**CATEGORY_ID**', args.category.id)}]`, e);
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
    const data = await axiosGet(STORES[storeKey].productsUrl.replace('**PAGE**', '1').replace('**CATEGORY_ID**', category.id));
    const totalProducts = data.total_count;
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