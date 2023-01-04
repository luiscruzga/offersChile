const storeKey = 'wom';
const { STORES } = require('../../config/config.json');
const { axiosGet, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.menu.filter(menu => menu.type === 'label').forEach(menu => {
    menu.subMenu.forEach(subMenu => {
      const href = subMenu.links;
      const name = `${menu.context} -> ${subMenu.text}`;
      finalCategories.push({
        id: STORES[storeKey].categoriesId.find(el => el.name === name)
          ? STORES[storeKey].categoriesId.find(el => el.name === name).id
          : 0,
        name: name,
        url: href.includes('https') ? href : `${STORES[storeKey].baseUrl}${href}`
      })
    });
  });
  return finalCategories;
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const data = await axiosGet(STORES[storeKey].categoriesUrl);

  let categoriesInfo = getUrlCategories(JSON.parse(data.data.header.text.text));
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
}

module.exports = {
  getCategories
}