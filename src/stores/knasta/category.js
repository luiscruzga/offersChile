const storeKey = 'knasta';
const { STORES } = require('../../config/config.json');
const { axiosGet, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    finalCategories.push({
      id: level1.category_id,
      name: `${level1.category_name}`,
      url: `${STORES[storeKey].baseUrl}/results?category=${level1.category_id}`
    });
  });

  return finalCategories;
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const categories = await axiosGet(STORES[storeKey].categoriesUrl);
  
  let categoriesInfo = getUrlCategories(categories.categories_tree.children);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}