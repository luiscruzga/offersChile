const storeKey = 'dafiti';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (dom) => {
  const finalCategories = [];
  [...dom.window.document.querySelectorAll('.navUl .segment')].forEach(el => {
    if (!el.parentElement.querySelector('.subNav')) {
      finalCategories.push({
        name: el.textContent.replace('\n', '').trim(),
        url: el.href
      });
    } else {
      [...el.parentElement.querySelectorAll('.subNav .sectionName')].forEach(sub => {
        if (sub.href != `${STORES[storeKey].baseUrl}/`) {
          finalCategories.push({
            name: `${el.textContent.replace('\n', '').trim()} -> ${sub.textContent.replace('\n', '').trim()}`,
            url: sub.href
          });
        } else {
          [...sub.parentElement.querySelectorAll('.prl .sectionItems')].forEach(item => {
            finalCategories.push({
              name: `${el.textContent.replace('\n', '').trim()} -> ${sub.textContent.replace('\n', '').trim()} -> ${item.textContent.replace('\n', '').trim()}`,
              url: item.href
            });
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
  const dom = await getDataUrl(STORES[storeKey].baseUrl, true);

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