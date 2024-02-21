const storeKey = "abcdin";
const { STORES } = require("../../config/config.json");
const { getDataUrl, saveFile } = require("../../utils");

/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = (categories) => {
  const finalCategories = [];
  categories.forEach((el) => {
    finalCategories.push({
      name: el.querySelector("span").textContent,
      url: el.href.includes(STORES[storeKey].baseUrl)
        ? el.href
        : `${STORES[storeKey].baseUrl}${el.href}`,
    });
  });

  return finalCategories;
};

/**
 * Permite obtener un listado de categorias desde la misma store
 */
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const dom = await getDataUrl(STORES[storeKey].baseUrl);

  let categoriesInfo = getUrlCategories([
    ...dom.window.document.querySelectorAll(
      '.desktop-menu > ul.nav > li.nav-item[role="menuitem"] > a'
    ),
  ]);
  if (STORES[storeKey].allowedCategories.length > 0) {
    categoriesInfo = categoriesInfo.filter(
      (category) =>
        STORES[storeKey].allowedCategories.filter((el) =>
          category.name.toLowerCase().includes(el.toLowerCase())
        ).length > 0
    );
  }
  saveFile(`${__dirname}/categories.json`, categoriesInfo);
  return categoriesInfo;
};

module.exports = {
  getCategories,
};
