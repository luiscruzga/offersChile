const storeKey = 'olimposports';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  return [...dom.window.document.querySelectorAll('.product-category a')].map(el => {
    return {
      name: el.querySelector('.woocommerce-loop-category__title').textContent,
      url: el.href,
      totalProducts: parseInt(el.querySelector('.uael-count').textContent.replace(' Products', ''))
    }
  });
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  try {
    log.info(`Getting categories of [${STORES[storeKey].name}]`);
    const dom = await getDataUrl(STORES[storeKey].categoriesUrl);

    let categoriesInfo = getUrlCategories(dom);
    if (STORES[storeKey].allowedCategories.length > 0) {
      categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
    }
    saveFile(`${__dirname}/categories.json`, categoriesInfo);
    return categoriesInfo;
  } catch (err) {
    const categories = require('./categories.json');
    return categories;
  }
}

module.exports = {
  getCategories
}