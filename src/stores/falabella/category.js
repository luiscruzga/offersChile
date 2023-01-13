const storeKey = 'falabella';
const { STORES } = require('../../config/config.json');
const { getDataUrl, saveFile } = require("../../utils/");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
/*const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(category => {
    if (category.subCategories && category.subCategories.length > 0) {
      category.subCategories.forEach((subCategory) => {
        if (subCategory.leafCategories && subCategory.leafCategories.length > 0) {
          subCategory.leafCategories.forEach(leafCategorie => {
            if (leafCategorie.label.toLocaleLowerCase() !== 'ver todo') {
              finalCategories.push({
                nombre: leafCategorie.label,
                url: `${STORES[storeKey].baseUrl}${leafCategorie.link}`
              });
            }
          });
        } else {
          if (subCategory.label.toLocaleLowerCase() !== 'ver todo') {
            finalCategories.push({
              name: subCategory.label,
              url: `${STORES[storeKey].baseUrl}${subCategory.link}`
            });
          }
        }
      });
    } else {
      finalCategories.push({
        name: category.label,
        url: `${STORES[storeKey].baseUrl}${category.link}`
      });
    }
  });

  return finalCategories;
}*/
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach(category => {
    if (category.second_level_categories && category.second_level_categories.length > 0) {
      category.second_level_categories.forEach(subCategory => {
        if (subCategory.item_url === '') return false;
        finalCategories.push({
          name: `${category.item_name} -> ${subCategory.item_name}`,
          url: subCategory.item_url
        });
      });
    } else {
      if (category.item_url === '') return false;
      finalCategories.push({
        name: category.item_name,
        url: category.item_url
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
  try {
    const dom = await getDataUrl(STORES[storeKey].baseUrl, true);
  
    const data = JSON.parse(dom.window.document.getElementById('__NEXT_DATA__').textContent);
    const rootCategories = data.props.pageProps.serverData.headerData.taxonomy.entry.all_accesses.categories;
    let categoriesInfo = getUrlCategories(rootCategories);
    if (STORES[storeKey].allowedCategories.length > 0) {
      categoriesInfo = categoriesInfo.filter(category => STORES[storeKey].allowedCategories.filter(el => category.name.toLowerCase().includes(el.toLowerCase())).length > 0);
    }
    if (STORES[storeKey].excludedCategories && STORES[storeKey].excludedCategories.length > 0) {
      categoriesInfo = categoriesInfo.filter(category => !STORES[storeKey].excludedCategories.find(el => category.name.toLowerCase().includes(el.toLowerCase())));
    }
    saveFile(`${__dirname}/categories.json`, categoriesInfo);
    return categoriesInfo;
  } catch (err) {
    const categories = require('./categories.json');
    return categories;
  }
}

module.exports = {
  getCategories
}