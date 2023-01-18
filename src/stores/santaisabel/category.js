const storeKey = 'santaisabel';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile, axiosGet } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(level1 => {
    if (level1.items) {
      level1.items.forEach(level2 => {
        if (level2.active) {
          finalCategories.push({
            name: `${level1.title} -> ${level2.title}`,
            url: `${STORES[storeKey].baseUrl}${level2.url}`,
            path: level2.url,
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
  try {
    log.info(`Getting categories of [${STORES[storeKey].name}]`);
    const dom = await getDataUrl(STORES[storeKey].categoriesUrl);
    const __renderData = JSON.parse([...dom.window.document.getElementsByTagName('script')].find(el => el.text.includes('__renderData')).text.replace('window.__renderData =', '').trim().slice(0,-1));
    let categoriesInfo = getUrlCategories(JSON.parse(__renderData).menu.acf.items);
    if (STORES[storeKey].allowedCategories.length > 0) {
      categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
    }
    saveFile(`${__dirname}/categories.json`, categoriesInfo);
    return categoriesInfo;  
  } catch (error) {
    try {
      const html = await axiosGet(STORES[storeKey].categoriesUrl);
      let categoriesInfo = getUrlCategories(JSON.parse(html.split('dom.window.__renderData = ').pop().split(';\n\t</script>')[0].slice(1,-1)));
      if (STORES[storeKey].allowedCategories.length > 0) {
        categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
      }
      saveFile(`${__dirname}/categories.json`, categoriesInfo);
      return categoriesInfo;  
    } catch (error) {
      console.log(`[${STORES[storeKey].name}]Category Error: `, error.message);
      const categories = require('./categories.json');
      return categories; 
    }
  }
}

module.exports = {
  getCategories
}