const storeKey = 'santaisabel';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

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
          finalCategories.push({
            name: `${level1.title} -> ${level2.title}`,
            url: `${STORES[storeKey].baseUrl}${level2.url}`,
            path: level2.url,
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
  const dom = await getDataUrl(STORES[storeKey].categoriesUrl, true);
  
  let categoriesInfo = getUrlCategories(JSON.parse(dom.window.__renderData).menu.acf.items);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}