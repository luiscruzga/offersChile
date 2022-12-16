const storeKey = 'microplay';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  return [...dom.window.document.querySelectorAll('.nav__link, .nav__extras--ofertas')].map(el => {
    const href = el.firstChild.href;
    return {
      name: el.firstChild.textContent.trim(),
      url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`
    }
  });
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const dom = await getDataUrl(STORES[storeKey].baseUrl);
  
  let categoriesInfo = getUrlCategories(dom);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}