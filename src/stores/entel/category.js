const storeKey = 'entel';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  const finalCategories = [];
  const data = JSON.parse(dom.window.document.getElementById('rootProductInfo_JSON').textContent.split("</var>")[0]);
  data.top.find(el => el.name === 'PLP Header Slot').contents[0].menuItems2.forEach(firstLevel => {
    firstLevel.menuItems.forEach(secondLevel => {
      finalCategories.push({
        name: `${firstLevel.name} -> ${secondLevel.name}`,
        url: secondLevel.link
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