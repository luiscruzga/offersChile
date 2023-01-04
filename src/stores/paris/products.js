const storeKey = 'paris';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, replaceAll } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
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
    const totalProductsPerPage = STORES[storeKey].totalProductsPerPage;
    const url = args.url.includes('?') ? `${args.url}&start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}` : `${args.url}?start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}`;
    const dom = await getDataUrl(url, true);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.product-tile[data-product]')];

    products.forEach(el => {
      const product = JSON.parse(el.dataset.product);
      product.url = el.querySelector('a').href;

      const images = [...el.querySelectorAll('img[itemprop="image"]')].map(img => img.dataset.src);
      const cardPrice = product.dimension20 === '' ? 0 : parseInt(product.dimension20);
      const offerPrice = product.dimension20 === '' ? 0 : parseInt(product.dimension20);
      const internetPrice = parseInt(product.price);
      let normalPrice = product.dimension19 === '' ? 0 : parseInt(product.dimension19);
      normalPrice = normalPrice === 0 ? offerPrice : normalPrice;
      const href = product.url;
      productsInfo.push({
        store: STORE_NAME,
        sku: product.id,
        name: product.name,
        description: product.name,
        brand: product.brand,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: images,
        thumbnail: images[0],
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
        offerPrice: internetPrice !== 0 ? internetPrice : offerPrice,
        cardPrice: cardPrice,
        isOutOfStock: product.dimension21 === 'True' ? false : true,
        isUnavailable: product.dimension21 === 'True' ? false : true,
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
const getTotalPages = async (url) => {
  try {
    const dom = await getDataUrl(url, true);
    const totalProducts = parseInt(replaceAll(dom.window.document.querySelector('.total-products > span').textContent, '\n', ''));
    return Math.round(totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
}
/**
 * Permite orquestar la extracción de productos dada una lista de categorias, dichos productos son almacenados en la BD Mongo
 * @param  {[object]} categories - Lista de categorias
 */
const getAllProducts = async (categories) => {
  return new Promise(async (resolve,reject) => {
    const { version } = require('../../config/versions.json');
    lastVersion = version;
    deleteProductsByVersion(STORE_NAME, lastVersion);

    const productsInfo = [];
    let contPages = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      const totalPages = await getTotalPages(category.url);
      let totalProducts = 0;
      log.info(`Category [${STORE_NAME}][${category.name}][${totalPages}]`);
      for (let page = 1; page <= totalPages; page++) {
        contPages++;
        await delay(DELAY_TIME_DEFAULT);
        getProductsByPage({
          url: category.url,
          page,
          category,
        })
        .then((productsList) => {
          log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
          saveProducts(productsList.products);
          totalProducts += productsList.products.length;
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);
      }

      await delay(3000);
      log.info(`Category [${STORE_NAME}][${category.name}] Total products: ${totalProducts}`);
    };

    await delay(3000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}