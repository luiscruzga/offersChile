const storeKey = 'tricot';
const { STORES } = require('../../config/config.json');
const { diffMinutes } = require("../../utils/");
const { getCategories } = require('./category');
const { getAllProducts } = require('./products');

const main = async () => {
  log.end('================================================================================');
  log.end(`Proceso Iniciado para [${STORES[storeKey].name}]`);
  log.end('================================================================================');
  
  const startDate = new Date();
  const categories = await getCategories();  
  const products = await getAllProducts(categories);

  const endDate = new Date();
  const finalTime = diffMinutes(startDate, endDate);
  log.end('================================================================================');
  log.end(`Proceso Finalizado Correctamente[${STORES[storeKey].name}], duración total ${finalTime} minutos`);
  log.end('================================================================================');
}

module.exports = {
  main,
}