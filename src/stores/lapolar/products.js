const storeKey = 'lapolar';
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
    const url = `${args.url}?start=${totalProductsPerPage*(args.page-1)}&sz=${totalProductsPerPage}&srule=best-matches`;
    
    const dom = await getDataUrl(url);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.lp-product-tile')];
    
    products.forEach(product => {
      const cardPrice = 0;
      const offerPrice = product.querySelector('.prices .normal .price-value')
        ? parseInt(product.querySelector('.prices .internet .price-value').dataset.value.split('.')[0])
        : 0;
      const normalPrice = product.querySelector('.prices .normal .price-value')
        ? parseInt(product.querySelector('.prices .normal .price-value').dataset.value.split('.')[0])
        : parseInt(product.querySelector('.prices .internet .price-value').dataset.value.split('.')[0]);
      const href = product.querySelector('.image-link').href;
      const productInfo = JSON.parse(product.dataset.gtm).ecommerce.impressions;

      productsInfo.push({
        store: STORE_NAME,
        sku: productInfo.id,
        name: productInfo.name,
        description: productInfo.name,
        brand: product.querySelector('.brand-name') ? product.querySelector('.brand-name').textContent.replace('\n','').replace('\n','').trim() : STORE_NAME,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: [product.querySelector('.tile-image').src],
        thumbnail: product.querySelector('.tile-image').src,
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
const getTotalPages = async (url) => {
  try {
    const dom = await getDataUrl(url);
    const totalProducts = parseInt(dom.window.document.querySelectorAll('.filtering__results-count')[1].textContent);
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
    let contTotalPages = 0;
    let contCategory = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      contCategory++;
      const totalPages = await getTotalPages(category.url);
      contTotalPages += totalPages;
      let productsCategory = [];
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
          productsCategory.push(...productsList.products);
          log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);
      }

      await delay(2000);
      saveProducts(productsCategory);
      log.info(`Category [${STORE_NAME}][${category.name}] Total products: ${productsCategory.length}`);
      productsCategory = [];
    };

    await delay(2000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}