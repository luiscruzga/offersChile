const storeKey = 'santaisabel';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { delay, axiosGet } = require('../../utils/');
const { saveProducts, deleteProductsByVersion } = require('../../utils/bd');
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
const getTotalPages = async (url) => {
  try {
    const data = await axiosGet(`${url}?page=1&sc=11`, {
      'x-api-key': 'IuimuMneIKJd3tapno2Ag1c1WcAES97j'
    });
    return Math.round((data.recordsFiltered || 0) / STORES[storeKey].totalProductsPerPage);
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
      const productsUrl = `${STORES[storeKey].productsUrl}${category.path}`;
      const totalPages = await getTotalPages(productsUrl);
      let totalProducts = 0;
      log.info(`Category [${STORE_NAME}][${category.name}][${totalPages}]`);
      for (let page = 1; page <= totalPages; page++) {
        contPages++;

        await delay(DELAY_TIME_DEFAULT);
        getProductsByPage({
          url: productsUrl,
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

    await delay(2000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}