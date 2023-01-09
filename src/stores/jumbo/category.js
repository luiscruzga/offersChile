const storeKey = 'jumbo';
const { STORES } = require('../../config/config.json');
const { axiosGet, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    if (level1.items) {
      level1.items.forEach(level2 => {
        if (level2.active) {
          const path = level2.url.indexOf('/') === 0 ? level2.url : `/${level2.url}`;
          finalCategories.push({
            name: `${level1.title} -> ${level2.title}`,
            url: `${STORES[storeKey].baseUrl}${path}`,
            path: path,
          });
        }
      });
    }
  });

  return finalCategories;
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const categories = await axiosGet(STORES[storeKey].categoriesUrl);
  
  let categoriesInfo = getUrlCategories(categories.acf.items);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}