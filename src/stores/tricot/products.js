const storeKey = 'tricot';
const { STORES, DELAY_LIMIT, DELAY_TIME, DELAY_TIME_DEFAULT } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, delay, transformPrice } = require('../../utils/');
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
    const dom = await getDataUrl(`${args.url}?page=${args.page}&cat=${args.category.id}`);
    const productsInfo = [];
    const products = [...dom.window.document.querySelectorAll('.producto_single')];
                  
    products.forEach(product => {
      const normalPrice = product.querySelector('.tachado_dentro')
        ? transformPrice(product.querySelector('.tachado_dentro').textContent)
        : transformPrice(product.querySelector('.precio_actual').textContent);
      const offerPrice = product.querySelector('.precio_actual')
      ? transformPrice(product.querySelector('.precio_actual').textContent)
      : 0;
      
      productsInfo.push({
        store: STORE_NAME,
        sku: product.dataset.codpro,
        name: product.querySelector('.detalle_ropa p').textContent,
        description: product.querySelector('.detalle_ropa p').textContent,
        brand: STORE_NAME,
        url: product.querySelector('.main_link').href,
        images: [product.querySelector('.main_link img').src],
        thumbnail: product.querySelector('.main_link img').src,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: offerPrice === 0 ? 0 : (100 - Math.round((offerPrice*100) / normalPrice)),
        discount: offerPrice === 0 ? 0 : (normalPrice - offerPrice),
        normalPrice: normalPrice,
        offerPrice: offerPrice,
        cardPrice: 0,
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
    const pagination = [...dom.window.document.querySelectorAll('.paginator [data-page]')];
    return pagination.length > 0
      ? parseInt(pagination[pagination.length -2].dataset.page)
      : 1;
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

    await delay(2000);
    deleteProductsByVersion(STORE_NAME, lastVersion);
    resolve(productsInfo);
  });
}

module.exports = {
  getAllProducts,
}