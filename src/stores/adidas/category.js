const storeKey = 'adidas';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(category => {
    category.items.forEach(item => {
      const href = item.header_link.external_link;
      finalCategories.push({
        name: `${category.title} -> ${item.header_link.title}`,
        url: href.includes(STORES[storeKey].baseUrl) ? href : `${STORES[storeKey].baseUrl}${href}`
      });
    });
  });

  return finalCategories;
}

/**
* Permite obtener un listado de categorias desde la misma store
*/
const getCategories = async () => {
  try {
    log.info(`Getting categories of [${STORES[storeKey].name}]`);
    const dom = await getDataUrl(STORES[storeKey].baseUrl, {});
    const info = eval([...dom.window.document.getElementsByTagName('script')].find(el => el.text.includes('window.DATA_STORE')).text.replace('window.DATA_STORE =', '').trim());
    let categoriesInfo = getUrlCategories(info.app.cmsContent['cms-header'].component_presentations[0].component.content_fields.items);
    if (STORES[storeKey].allowedCategories.length > 0) {
      categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
    }
    saveFile(`${__dirname}/categories.json`, categoriesInfo);
    return categoriesInfo;
  } catch (err) {
    const categoriesInfo = require('./categories.json');
    return categoriesInfo;
  }
}

module.exports = {
  getCategories
}