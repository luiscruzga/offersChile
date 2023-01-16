const storeKey = 'paris';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile, replaceAll } = require("../../utils/");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  const finalCategories = [];
  const allowedCategories = STORES[storeKey].allowedCategories;
  var firstCategories = [...dom.window.document.querySelectorAll('li.navigation-drawer-body-mobile__list-item > a > span')];

  firstCategories.forEach(el => {
    let categoryName = (replaceAll(el.textContent, '\n', '')).trim();
    if (
      allowedCategories.length === 0 ||
      allowedCategories.filter(el => categoryName.toLowerCase().includes(el.toLowerCase())).length > 0) {
      const subCategories = el.parentElement.parentElement.querySelectorAll('.subItem__link');
      subCategories.forEach(subEl => {
        categoryName += ` -> ${(replaceAll(subEl.textContent, '\n', '')).trim()}`;
        const lastLevel = subEl.parentElement.querySelectorAll('ul > li > a > span');
        lastLevel.forEach(lastEl => {
          finalCategories.push({
            name: `${(replaceAll(`${el.textContent} -> ${subEl.textContent} -> ${lastEl.textContent}`, '\n', '')).trim()}`,
            url: lastEl.parentElement.href
          });
        })
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