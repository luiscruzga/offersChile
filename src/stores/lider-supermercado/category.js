const storeKey = 'lider-supermercado';
const { STORES } = require('../../config/config.json');
const { axiosGet, saveFile, replaceAll } = require("../../utils");

const transformCategoryName = (category) => {
  return replaceAll(category, ' ', '_');
}
/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    if (level1.categoriesLevel2) {
      finalCategories.push({
        name: level1.label,
        url: `${STORES[storeKey].baseUrl}/category/${transformCategoryName(level1.label)}`,
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
  
  let categoriesInfo = getUrlCategories(categories.categories);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}