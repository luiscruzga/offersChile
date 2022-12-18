const storeKey = 'decathlon';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  /*return [...dom.window.document.querySelectorAll('.mm-list .category-sports a')].filter(el => !el.className.includes('mm-subopen')).map(el => {
    const idSubmenu = el.href.split('#').pop();
    const href = [...dom.window.document.querySelectorAll(`#${idSubmenu} a`)].filter(el => el.textContent.trim().toLowerCase() === 'ver todo')[0].href;
    return {
      name: el.textContent.trim(),
      url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`
    }
  });*/
  return [...dom.window.document.querySelectorAll('.category-sports a .title')].map(el => {
    href = el.parentElement.href;
    return {
      name: el.textContent.trim(),
      url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`
    }
  });
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