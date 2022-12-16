const storeKey = 'easy';
const { STORES } = require('../../config/config.json');
const { axiosPost, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    level1.menu.forEach(level2 => {
      finalCategories.push({
        name: `${level1.name} -> ${level2.name}`,
        url: `${STORES[storeKey].baseUrl}/${level2.slug}`,
      });
    });
  });

  return finalCategories;
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const categories = await axiosPost(STORES[storeKey].categoriesUrl, {
    "operationName": "getMenus",
    "variables": {},
    "extensions": {
      "persistedQuery": {
          "version": 1,
          "sha256Hash": STORES[storeKey].sha256Hash,
          "sender": "easycl.mega-menu@0.x",
          "provider": "easycl.mega-menu@0.x"
      },
      "variables": "eyJpc01vYmlsZSI6ZmFsc2V9"
    }
  });
  
  let categoriesInfo = getUrlCategories(categories.data.menus);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}