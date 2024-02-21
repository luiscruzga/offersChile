const storeKey = "abcdin";
const { STORES } = require("../../config/config.json");
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, replaceAll } = require("../../utils/");
let lastVersion = 1;
const totalPerPage = STORES[storeKey].totalProductsPerPage;

/**
 * Permite obtener los productos dada una categoria y página
 * @param {object} args
 * @param {string} args.url - url de la categoria
 * @param {number} args.page - pagina de la categoria
 * @param {object} args.category - category
 * @param {string} args.category.url - url de la categoria
 * @param {string} args.category.name - name de la categoria
 */
const getProductsByPage = async (args) => {
  try {
    const dom = await getDataUrl(
      `${args.url}?product_list_limit=${totalPerPage}&start=${
        (args.page - 1) * totalPerPage
      }&sz=${totalPerPage}`
    );
    const productsInfo = [];
    const products = [
      ...dom.window.document.querySelectorAll(
        ".product-grid > .product-tile__item"
      ),
    ];
    products.forEach((product) => {
      if (product.querySelector(".pdp-link a").textContent !== "") {
        const cardPrice = product.querySelector(
          ".prices > .js-tlp-price > .price-value"
        )
          ? parseInt(
              replaceAll(
                product
                  .querySelector(".prices > .js-tlp-price > .price-value")
                  .textContent.replace("$", ""),
                ".",
                ""
              )
            )
          : 0;
        const offerPrice = product.querySelector(
          ".prices > .js-internet-price > .price-value"
        )
          ? parseInt(
              replaceAll(
                product
                  .querySelector(".prices > .js-internet-price > .price-value")
                  .textContent.replace("$", ""),
                ".",
                ""
              )
            )
          : 0;
        let normalPrice = product.querySelector(
          ".prices > .js-normal-price > .price-value"
        )
          ? parseInt(
              replaceAll(
                product
                  .querySelector(".prices > .js-normal-price > .price-value")
                  .textContent.replace("$", ""),
                ".",
                ""
              )
            )
          : 0;
        normalPrice = normalPrice === 0 ? offerPrice : normalPrice;

        const productUrl = product.querySelector(".pdp-link a").href;
        productsInfo.push({
          store: STORE_NAME,
          sku: product.querySelector(".product-tile__wrapper").dataset.pid,
          name: product.querySelector(".pdp-link a").textContent,
          description: product.querySelector(".pdp-link a").textContent,
          brand: replaceAll(
            product.querySelector(".tile-brand p").textContent,
            "\n",
            ""
          ).trim(),
          url: productUrl.includes(STORES[storeKey].baseUrl)
            ? productUrl
            : `${STORES[storeKey].baseUrl}${productUrl}`,
          images: [product.querySelector(".tile-image").src],
          thumbnail: product.querySelector(".tile-image").src,
          category: args.category.url,
          categoryName: args.category.name,
          discountPercentage:
            cardPrice !== 0
              ? 100 - Math.round((cardPrice * 100) / normalPrice)
              : offerPrice !== 0
              ? 100 - Math.round((offerPrice * 100) / normalPrice)
              : 0,
          discount:
            cardPrice !== 0
              ? normalPrice - cardPrice
              : offerPrice !== 0
              ? normalPrice - offerPrice
              : 0,
          normalPrice: normalPrice,
          offerPrice: offerPrice,
          cardPrice: cardPrice,
          isOutOfStock: false,
          isUnavailable: false,
          version: lastVersion,
        });
      }
    });

    return {
      category: args.category.name,
      products: productsInfo,
    };
  } catch (e) {
    log.error(
      `${args.url}?product_list_limit=${totalPerPage}&start=${
        (args.page - 1) * totalPerPage
      }&sz=${totalPerPage}`,
      e
    );
    return {
      category: args.category.name,
      products: [],
    };
  }
};
/**
 * Permite obtener el total de páginas de una categoria
 * @param  {string} url - URL de la categoria de la cual se desea obtener el total de páginas
 * @return {number}
 */
const getTotalPages = async (category) => {
  try {
    const dom = await getDataUrl(
      `${category.url}?product_list_limit=${totalPerPage}`
    );
    const totalProducts = parseInt(
      [...dom.window.document.querySelectorAll(".filtering__results-count")][1]
        .textContent
    );
    return Math.round(totalProducts / totalPerPage);
  } catch (err) {
    return 1;
  }
};

module.exports = {
  getProductsByPage,
  getTotalPages,
};
