const storeKey = 'hites';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, replaceAll, transformPrice } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
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
    const startProducts = ((args.page-1) * totalPerPage);
    const dom = await getDataUrl(`${args.url}?sz=${totalPerPage}&start=${startProducts}&srule=discount-off`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.product-tile')];

    products.forEach(product => {
      const cardPrice = product.querySelector('.price-item.hites-price') ? transformPrice(product.querySelector('.price-item.hites-price').textContent) : 0;
      const offerPrice = product.querySelector('.price-item.sales .value') ? product.querySelector('.price-item.sales .value').getAttribute('content') : 0;
      const normalPrice = product.querySelector('.price-item.list .value') ? product.querySelector('.price-item.list .value').getAttribute('content') : 0;
      const href = product.querySelector('.product-name--bundle').href;
      const hasStock = product.querySelector('.outofstock').closest('.d-none') ? true : false;

      productsInfo.push({
        store: STORE_NAME,
        sku: product.dataset.pid,
        name: product.querySelector('.product-name--bundle').textContent,
        description: product.querySelector('.product-name--bundle').textContent,
        brand: product.querySelector('.product-brand').textContent,
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
        isOutOfStock: !hasStock,
        isUnavailable: !hasStock,
        version: lastVersion
      });
    });
    
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    console.error(e);
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
    const dom = await getDataUrl(`${url}?sz=${totalPerPage}&start=0&srule=discount-off`);
    const totalProducts = parseInt(replaceAll(dom.window.document.querySelector('.product-results-count').textContent.split('de ').pop().split(')')[0], ',',''));
    return Math.round(totalProducts / totalPerPage);
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

      await delay(3000);
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