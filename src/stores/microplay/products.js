const storeKey = 'microplay';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { v4: uuidv4 } = require('uuid');
const { axiosPostDom, delay, transformPrice } = require('../../utils/');
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
    
    const dom = await axiosPostDom(STORES[storeKey].productsUrl, {
      "pars": `{'familia':{'catalogo':'${args.url.split('/').pop()}'},'filtro':[],'control':{'buscar':''}}`,
      "page": args.page
    });
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.card__item')];

    products.forEach(product => {
      const cardPrice = 0;
      const offerPrice = product.querySelector('.price_normal b')
        ? transformPrice(product.querySelector('.price_main b').textContent) 
        : 0;
      const normalPrice = product.querySelector('.price_normal b')
        ? transformPrice(product.querySelector('.price_normal b').textContent) 
        : product.querySelector('.price_main b')
        ? transformPrice(product.querySelector('.price_main b').textContent)
        : 0;
      const href = product.querySelector('a.btn-titulo').href;
      const hasStock = product.querySelector('.price_main b') ? true : false;

      productsInfo.push({
        store: STORE_NAME,
        sku: uuidv4(),
        name: product.querySelector('.btn-titulo p').textContent,
        description: product.querySelector('.btn-titulo p').textContent,
        brand: STORE_NAME,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`,
        images: [product.querySelector('.cont-imagen img').src],
        thumbnail: product.querySelector('.cont-imagen img').src,
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
    log.error(`[${STORE_NAME}][${STORES[storeKey].productsUrl}]`, e);
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
  return 100;
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
      let pagesWithErrors = 0;
      let totalProducts = 0;
      let productsCategory = [];
      log.info(`Category [${STORE_NAME}][${category.name}][${totalPages}]`);
      for (let page = 1; page <= totalPages; page++) {
        contPages++;
        if (pagesWithErrors >= 3) break;
        await delay(DELAY_TIME_DEFAULT);
        getProductsByPage({
          url: category.url,
          page,
          category,
        })
        .then((productsList) => {
          if (productsList.products.length === 0 ) pagesWithErrors++;
          if (productsList.products.length < 20) pagesWithErrors = 10;
          log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})][${page} - ${totalPages}]: ${productsList.products.length}`);
          productsCategory.push(...productsList.products);
          totalProducts += productsList.products.length;
        });
        if (contPages%DELAY_LIMIT === 0) await delay(DELAY_TIME);
      }

      await delay(3000);
      saveProducts(productsCategory);
      log.info(`Category [${STORE_NAME}][${category.name}] Total products: ${totalProducts}`);
      productsCategory = [];
    };

    resolve(productsInfo);
  });
}

module.exports = {
  getProductsByPage,
  getTotalPages,
  getAllProducts,
}