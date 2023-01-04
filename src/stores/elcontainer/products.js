const storeKey = 'elcontainer';
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
    const products = [...dom.window.document.querySelectorAll('.product_list .product-container')]
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.price_container .old-price')
        ? transformPrice(product.querySelector('.price_container .old-price').textContent)
        : transformPrice(product.querySelector('.price_container .price').textContent);
      const offerPrice = product.querySelector('.price_container .old-price')
        ? transformPrice(product.querySelector('.price_container .price').textContent)
        : 0;
      let image = product.querySelector('.product_img_link .img-responsive').dataset.src;
      image = image.indexOf('http') !== -1 ? image : `${STORES[storeKey].baseUrl}${image}`;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.querySelector('[data-id-product]') 
          ? product.querySelector('[data-id-product]').dataset.idProduct
          : [...product.querySelector('.sfl_shorlist_large_link span').classList].find(el => el.includes('sfl_product_link_')).replace('sfl_product_link_', ''),
        name: product.querySelector('.product-name').textContent,
        description: product.querySelector('.product-name').textContent,
        brand: STORE_NAME,
        url: product.querySelector('.product-name').href,
        images: [image],
        thumbnail: image,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
        isOutOfStock: product.querySelector('.out-of-stock') ? true : false,
        isUnavailable: product.querySelector('.out-of-stock') ? true : false,
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
    const totalProducts = parseInt(dom.window.document.querySelector('.product-count').textContent.replace('artículos', '').trim().split(' ').pop());
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