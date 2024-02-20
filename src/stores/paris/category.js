const storeKey = "paris";
const { STORES } = require("../../config/config.json");
const { getDataUrl, saveFile, replaceAll } = require("../../utils/");

const getCategoryId = async (url) => {
  const dom = await getDataUrl(url);
  return dom.window.document.querySelector("#categoryName").value;
};
/**
 * Permite recorrer el listado de categorias y obtener como lista
 * @param  {object} categories - Arreglo de categorias
 */
const getUrlCategories = async (dom) => {
  const finalCategories = [];
  const allowedCategories = STORES[storeKey].allowedCategories;
  const firstCategories = [
    ...dom.window.document.querySelectorAll(
      "ul.main-menu__list > li.main-menu__item > a > span"
    ),
  ];

  for (const el of firstCategories) {
    let categoryName = replaceAll(el.textContent, "\n", "").trim();
    if (
      allowedCategories.length === 0 ||
      allowedCategories.filter((el) =>
        categoryName.toLowerCase().includes(el.toLowerCase())
      ).length > 0
    ) {
      const subCategories = el.parentElement.parentElement.querySelectorAll(
        ".main-menu__submenu-wrapper"
      );
      for (const subEl of subCategories) {
        const lastLevel = subEl.parentElement.querySelectorAll(
          ".main-menu__submenu-list-wrapper .main-menu__submenu-item--has-submenu > ul > li.main-menu__submenu-item--show-all > a > span"
        );
        for (const lastEl of lastLevel) {
          const subCatName = lastEl.textContent.replace("Ver todo", "").trim();
          categoryName += ` -> ${replaceAll(subCatName, "\n", "").trim()}`;
          const categoryId = await getCategoryId(lastEl.parentElement.href);
          finalCategories.push({
            name: `${replaceAll(
              `${el.textContent} -> ${subCatName}`,
              "\n",
              ""
            ).trim()}`,
            url: lastEl.parentElement.href,
            categoryId: categoryId,
          });
        }
      }
    }
  }

  return finalCategories;
};

/**
 * Permite obtener un listado de categorias desde la misma store
 */
const getCategories = async () => {
  log.info(`Getting categories of [${STORES[storeKey].name}]`);
  const dom = await getDataUrl(STORES[storeKey].baseUrl);

  let categoriesInfo = await getUrlCategories(dom);
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
