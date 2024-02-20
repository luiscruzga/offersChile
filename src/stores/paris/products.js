const storeKey = "paris";
const { STORES } = require("../../config/config.json");
const STORE_NAME = STORES[storeKey].name;
const { getDataUrl, replaceAll, axiosGet } = require("../../utils/");
let lastVersion = 1;

/**
 * Permite obtener los productos dada una categoria y página
 * @param {object} args
 * @param {string} args.url - url de la categoria
 * @param {number} args.page - pagina de la categoria
 * @param {object} args.category - category
 * @param {string} args.category.url - url de la categoria
 * @param {string} args.category.name - name de la categoria
 */

const getProductNameUrl = (productName) => {
  return productName
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-zA-Z0-9.]/g, "");
};

const getProductsByPage = async (args) => {
  try {
    const url = STORES[storeKey].productsUrl
      .replace(
        "**INIT**",
        (args.page - 1) * STORES[storeKey].totalProductsPerPage
      )
      .replace("**LIMIT**", STORES[storeKey].totalProductsPerPage)
      .replace("**CATEGORY**", args.category.categoryId);
    const data = await axiosGet(url, {
      Platform: "web",
      Apikey: "cl-ccom-parisapp-plp",
    });
    const productsInfo = [];
    const products = data.payload.data.hits;
    const productsId = products.map((product) => product.product_id);

    const newData = await axiosGet(
      `https://cl-ccom-parisapp-promotions.ecomm.cencosud.com/getPromotionsServiceSdk/${productsId.join(
        ","
      )}`,
      {
        Platform: "web",
        Apikey: "cl-ccom-parisapp-promotions",
      }
    );
    const newProducts = newData.payload.arrayPromo;
    newProducts.forEach((product) => {
      productsInfo.push({
        store: STORE_NAME,
        sku: product.id,
        name: product.detail_product.name,
        description:
          product.detail_product.short_description ||
          product.detail_product.long_description,
        brand: product.brand,
        url: `${STORES[storeKey].baseUrl}/${getProductNameUrl(
          product.detail_product.name
        )}-${product.id}.html`,
        images: product.detail_product.image_groups[0].images.map(
          (el) => el.link
        ),
        thumbnail: product.detail_product.image_groups[0].images[0].link,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage:
          product.detail_product.prices["clp-cencosud-prices"] &&
          product.detail_product.prices["clp-cencosud-prices"] > 0
            ? Math.round(
                ((product.detail_product.prices["clp-list-prices"] -
                  product.detail_product.prices["clp-cencosud-prices"]) *
                  100) /
                  product.detail_product.prices["clp-list-prices"]
              )
            : Math.round(
                ((product.detail_product.prices["clp-list-prices"] -
                  product.detail_product.prices["clp-internet-prices"]) *
                  100) /
                  product.detail_product.prices["clp-list-prices"]
              ),
        discount:
          product.detail_product.prices["clp-cencosud-prices"] &&
          product.detail_product.prices["clp-cencosud-prices"] > 0
            ? product.detail_product.prices["clp-list-prices"] -
              product.detail_product.prices["clp-cencosud-prices"]
            : product.detail_product.prices["clp-list-prices"] -
              product.detail_product.prices["clp-internet-prices"],
        normalPrice: product.detail_product.prices["clp-list-prices"] || 0,
        offerPrice: product.detail_product.prices["clp-internet-prices"] || 0,
        cardPrice: product.detail_product.prices["clp-cencosud-prices"] || 0,
        isOutOfStock: !product.detail_product.inventory.orderable,
        isUnavailable: !product.detail_product.inventory.orderable,
        version: lastVersion,
      });
    });

    return {
      category: args.category.name,
      products: productsInfo,
    };
  } catch (e) {
    log.error(`[${STORE_NAME}][${STORES[storeKey].productsUrl}]`, e);
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
    const dom = await getDataUrl(category.url);
    const totalProducts = parseInt(
      replaceAll(
        replaceAll(
          dom.window.document.querySelector(".total-products > span")
            .textContent,
          "\n",
          ""
        ),
        ",",
        ""
      )
    );
    return Math.round(totalProducts / STORES[storeKey].totalProductsPerPage);
  } catch (err) {
    return 1;
  }
};

module.exports = {
  getProductsByPage,
  getTotalPages,
};
