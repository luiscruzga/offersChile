const storeKey = 'ripley';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils/");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} category - Objeto de categoria desde la store
 * @param  {object[]} categoriesInfo - Arreglo de categorias obtenidas
 * @param  {string} url - url de la categoria
 * @param  {string} name - nombre de la categoria
 */
 const getUrlCategories = (category, categoriesInfo, url, name) => {
  url += `/${category.slug}`;
  name += name === '' ? category.name : ` -> ${category.name}`;
  
  if (typeof category.categories !== 'undefined'
    && category.categories !== undefined 
    && category.categories.length > 0
  ){
    if (category.categories[0].categories.length > 0) {
      category.categories.forEach(categoryChild => {       
        getUrlCategories(categoryChild, categoriesInfo, url, name);
      });
    } else {
      categoriesInfo.push({
        'name': name,
        'url': `${STORES[storeKey].baseUrl}${url}`,
      });
    }
  } else {      
    categoriesInfo.push({
      'name': name,
      'url': `${STORES[storeKey].baseUrl}${url}`,
    });
  }
}

/**
 * Permite obtener un listado de categorias desde la misma store
 */
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const dom = await getDataUrl(STORES[storeKey].baseUrl, true);
  
  let categoriesInfo = [];
  if(typeof dom.window.__PRELOADED_STATE__ !== 'undefined'
    && typeof dom.window.__PRELOADED_STATE__.categories !== 'undefined'
  ){
    const categories = dom.window.__PRELOADED_STATE__.categories.normal;
    categories.forEach(category => {
      getUrlCategories(category, categoriesInfo, '', '');
    });
  }
  categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}