const { PG_ADMIN } = require('../config/config.json');
const { Client } = require('pg');
const format = require('pg-format');
let client, clientTelegram;

const PGConnect = async () => {
  client = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DB,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  })
  
  await client.connect();
  return client;
}

const PGDisconnect = async () => {
  if (client) client.end();
}

const PGConnectTelegram = async () => {
  clientTelegram = new Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DB,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
  })
  
  await clientTelegram.connect();
  return clientTelegram;
}

const PGDisconnectTelegram = async () => {
  if (clientTelegram) clientTelegram.end();
}

const evaluateError = async (error, cb) => {
  try {
    if (error.indexOf('Client was closed and is not queryable') !== -1) {
      await PGConnect();
      cb();
    }
  } catch (err) {
    return true;
  }
}

const bulkInsert = async (data) => {
  try {
    const rows = [];
    data.forEach(row => {
      rows.push([
        row.store || '',
        row.sku || '',
        row.name || '',
        row.description || '',
        row.brand || '',
        row.url || '',
        row.thumbnail || '',
        row.category || '',
        row.categoryName || '',
        parseInt(row.discountPercentage) || 0,
        parseInt(row.discount) || 0,
        parseInt(row.normalPrice) || 0,
        parseInt(row.offerPrice) || 0,
        parseInt(row.cardPrice) || 0,
        row.isOutOfStock ? 'S' : 'N',
        row.isUnavailable ? 'S' : 'N',
        parseInt(row.version)  || 0
      ]);
    });
    const command = format(`INSERT INTO "OCT_ALL_PRODUCTS" (store, sku, name, description, brand, url, thumbnail, category, categoryname, discountpercentage, discount, normalprice, offerprice, cardprice, isoutofstock, isunavailable, version) VALUES %L`, rows);
    //const client = await connect();
    await client.query(command);
    //client.end;
  } catch (error) {
    log.error('PG ERROR 1: ', error);
    evaluateError(error, bulkInsert(data));
  }  
}

const bulkDelete = async (store, version) => {
  try {
    await client.query(`DELETE FROM "OCT_ALL_PRODUCTS" WHERE 1=1 AND store=$1 and version<$2`, [store, version]);
  } catch (error) {
    log.error('PG ERROR 2: ', error);
    evaluateError(error, bulkDelete(store, version));
  }  
}

const loadUniqueProducts = async (store) => {
  try {
    await client.query(`CALL "OCP_UNIQUE_PRODUCTS"($1)`, [store]);
  } catch (error) {
    log.error('PG ERROR 3: ', error);
    evaluateError(error, loadUniqueProducts(store));
  }  
}

const addHistoryProducts = async (store) => {
  try {
    await client.query(`CALL "ocp_add_history_products"($1)`, [store]);
  } catch (error) {
    log.error('PG ERROR 7: ', error);
    evaluateError(error, loadUniqueProducts(store));
  }  
}

const getProductsToReport = async (store = null) => {
  try {
    const { rows } = await clientTelegram.query(`SELECT * FROM "ocf_get_products_to_report"($1, $2) WHERE isoutofstock = 'N' LIMIT 50`, [store, process.env.PERCENTAGE_FILTER]);
    return rows;
  } catch (error) {
    log.error('PG ERROR 4: ', error);
  }  
}

const getProductsRandom = async (filter = null, discountpercentage = null, total = null) => {
  try {
    const newClient = new Client({
      host: process.env.PG_HOST,
      port: process.env.PG_PORT,
      database: process.env.PG_DB,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
    })
    
    await newClient.connect();
    const { rows } = await newClient.query(`SELECT * FROM "ocf_get_random_products"($1, $2, $3)`, [filter, discountpercentage, total]);
    newClient.end();
    return rows;
  } catch (error) {
    log.error('PG ERROR 6: ', error);
  }  
}

const saveReportedProduct = async (product) => {
  try {
    const command = 'INSERT INTO "oct_products_reported" (store, name, brand, discountpercentage, discount, normalprice, offerprice, cardprice) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
    const { rows } = await clientTelegram.query(command, product);
    return rows;
  } catch (error) {
    log.error('PG ERROR 5: ', error);
  }
}

module.exports = {
  PGConnect,
  PGConnectTelegram,
  PGDisconnect,
  PGDisconnectTelegram,
  bulkInsert,
  bulkDelete,
  loadUniqueProducts,
  getProductsToReport,
  saveReportedProduct,
  getProductsRandom,
  addHistoryProducts,
}