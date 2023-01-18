const storeKey = 'tricot';
const { STORES } = require('../../config/config.json');
const { saveFile } = require("../../utils");
const menus = require('./menus.json');

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    level1.subcategorias.forEach(level2 => {
      finalCategories.push({
        id: level2.lev3_id,
        name: `${level1.lev2} -> ${level2.lev3}`,
        url: `${STORES[storeKey].baseUrl}/coleccion/${level1.lev2_slug}/${level2.lev3_slug}`
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
  let categoriesInfo = getUrlCategories(menus);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}