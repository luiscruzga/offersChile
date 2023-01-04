const storeKey = 'abcdin';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, replaceAll } = require('../../utils/');
let lastVersion = 1;
const totalPerPage = STORES[storeKey].totalProductsPerPage;

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
    const dom = await getDataUrl(`${args.url}?product_list_limit=${totalPerPage}&p=${args.page}`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.product-items > .product-item')];
    products.forEach(product => {
      if (product.querySelector('.product-item-name a').textContent !== '') {
        const cardPrice = product.querySelector('.card-price .price') ? parseInt(replaceAll(product.querySelector('.card-price .price').textContent.replace('$', ''), '.', '')) : 0;
        const offerPrice = product.querySelector('.internet-price .price-wrapper') ? parseInt(product.querySelector('.internet-price .price-wrapper').dataset.priceAmount) : 0;
        let normalPrice = product.querySelector('.normal-price .price-wrapper') ? parseInt(product.querySelector('.normal-price .price-wrapper').dataset.priceAmount) : 0;
        normalPrice = normalPrice === 0 ? offerPrice : normalPrice;
        productsInfo.push({
          store: STORE_NAME,
          sku: product.dataset.id,
          name: product.querySelector('.product-item-name a').textContent,
          description: product.querySelector('.product-item-name a').textContent,
          brand: product.querySelector('.product-item-brand').textContent,
          url: product.querySelector('.product-item-name a').href,
          images: [product.querySelector('.product-image-photo').src],
          thumbnail: product.querySelector('.product-image-photo').src,
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
      }
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
    const dom = await getDataUrl(`${category.url}?product_list_limit=${totalPerPage}`);
    const totalProducts = parseInt(dom.window.document.querySelector('.toolbar-number').textContent);
    return Math.round(totalProducts / totalPerPage);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}