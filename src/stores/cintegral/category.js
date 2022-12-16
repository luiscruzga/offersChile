const storeKey = 'cintegral';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  const finalCategories = [];
  [...dom.window.document.querySelectorAll('.level-1.parent .item-header a')].forEach(el => {
    finalCategories.push({
      name: `${el.closest('.parent').querySelector('a span').textContent} -> ${el.textContent}`,
      url: el.href
    });
  });

  [...dom.window.document.querySelectorAll('.level-1.parent .tvmega-menu-link a')].forEach(el => {
    if (!el.closest('.item-header')) {
      finalCategories.push({
        name: `${el.closest('.parent').querySelector('a span').textContent} -> ${el.textContent}`,
        url: el.href
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
  const dom = await getDataUrl(STORES[storeKey].categoriesUrl);

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