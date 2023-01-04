const storeKey = 'lider-supermercado';
const { STORES } = require('../../config/config.json');
const STORE_NAME = STORES[storeKey].name;
const { axiosPost } = require('../../utils/');
const productsCount = STORES[storeKey].totalProductsPerPage;
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
const getProductsByPage = async (args) => {
  try {
    const data = await axiosPost(STORES[storeKey].productsUrl, {
      categories: args.url.split('/').pop(),
      facets: [],
      hitsPerPage: productsCount,
      page: args.page,
      sortBy: 'discount_desc'
    });
    const productsInfo = [];
    const products = data.products;

    products.forEach(product => {
      productsInfo.push({
        store: STORE_NAME,
        sku: product.skuId,
        name: product.displayName,
        description: product.description,
        brand: product.brand,
        url: `https://www.lider.cl/catalogo/product/sku/${product.sku}/${product.slug}`,
        images: [product.images.defaultImage],
        thumbnail: product.images.defaultImage,
        category: args.category.url,
        categoryName: args.category.name,
        discountPercentage: product.discount,
        discount: (product.price.BasePriceReference - product.price.BasePriceSales),
        normalPrice: product.price.BasePriceReference,
        offerPrice: product.price.BasePriceSales,
        cardPrice: product.price.BasePriceTLMC,
        isOutOfStock: !product.available,
        isUnavailable: !product.makePublic,
        version: lastVersion
      });
    });
      
    return {
      category: args.category.name,
      products: productsInfo
    };
  } catch (e){
    return {
      category: args.category.name,
      products: [],
    };
  }
}
/**
 * Permite obtener el total de páginas de una categoria
 * @param  {string} url - URL de la categoria de la cual se desea obtener el total de páginas
 * @return {number}
 */
const getTotalPages = async (ucategory) => {
  try {
    const data = await axiosPost(STORES[storeKey].productsUrl, {
      categories: category.url.split('/').pop(),
      facets: [],
      hitsPerPage: productsCount,
      page: 1,
      sortBy: 'discount_desc'
    });
    return Math.round(data.nbHits / productsCount);
  } catch (err) {
    return 1;
  }
}

module.exports = {
  getProductsByPage,
  getTotalPages,
}