const storeKey = 'labarra';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, replaceAll, axiosPost } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
const productsCount = STORES[storeKey].totalProductsPerPage;
let lastVersion = 1;

/**
 * Permite obtener los productos dada una categoria y página
 * @param {object} args
 * @param {string} args.url - url de la categoria
 * @param {number} args.page - pagina de la categoria
 * @param {object} args.category - category
 * @param {number} args.category.id - internal id
 * @param {string} args.category.url - url de la categoria
 * @param {string} args.category.name - name de la categoria
 */
const getProductsByPage = async (args) => {
  try {
    const data = await axiosPost(STORES[storeKey].productsUrl, {
      category: [args.category.id],
      filters: {},
      sort_by: '',
      image_size_main: 'image_256',
      image_size_secondary: 'image_256',
      location: '748',
      page: args.page,
      pagination: STORES[storeKey].totalProductsPerPage
    }, {'api-key': 'public1', 'Accept': '*/*', 'Accept-Encoding': 'gzip,deflate,compress', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 OPR/92.0.0.0'});
    const productsInfo = [];
    const products = data.rows;

    products.forEach(product => {
      productsInfo.push({
        store: STORE_NAME,
        sku: product.id,
        name: `[${product.units} ${product.packing}] ${product.name}[${product.format}]`,
        description: `[${product.units} ${product.packing}] ${product.name}[${product.format}]`,
        brand: product.brand,
        url: `${STORES[storeKey].baseUrl}/producto/${product.slug}`,
        images: [product.media],
        thumbnail: product.media,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: (100 - Math.round((product.unit_price*100) / product.reference_price)),
        discount: (product.reference_price - product.unit_price),
        normalPrice: product.reference_price,
        offerPrice: product.unit_price,
        cardPrice: 0,
        isOutOfStock: product.out_of_stock,
        isUnavailable: product.out_of_stock,
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

const getTotalPages = async (category) => {
  return 1;
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
    let contCategory = 0;
    
    //categories.forEach(async (category, categoryIndex) => {
    for(let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex];
      contCategory++;
      const page = 1;
      await delay(DELAY_TIME_DEFAULT);
      getProductsByPage({
        url: category.url,
        page,
        category,
      })
      .then((productsList) => {
        log.info(`[${STORE_NAME}][${category.name}(${categoryIndex} - ${categories.length})] Total products: ${productsList.products.length}`);
        saveProducts(productsList.products);
      });
      if (contCategory%DELAY_LIMIT === 0) await delay(DELAY_TIME);    
    };

    resolve(productsInfo);
  });
}

module.exports = {
  getProductsByPage,
  getTotalPages,
  getAllProducts,
}