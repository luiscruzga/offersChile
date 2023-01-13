require('dotenv').config();
global.mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./utils/logger');
const { PGConnect, PGDisconnect } = require('./utils/pg');
global.log = Logger;
const versions = require('./config/versions.json');
const { saveFile, delay } = require('./utils/');
const { reportProducts } = require('./telegram/');
const { STORES } = require('./config/config.json');
const storesMain = require('./stores');
let filterStore = process.env.FILTER_STORE || '';
let excludedStores = process.env.EXCLUDE_STORE || '';
if (filterStore !== '') {
  filterStore = filterStore.split(';')
}
if (excludedStores !== '') {
  excludedStores = excludedStores.split(';');
}

// Clear logs
if (process.env.CLEAR_LOGS) {
  const directory = path.join(__dirname, './logs/')
  for (const file of fs.readdirSync(directory)) {
    fs.unlinkSync(path.join(directory, file));
  }
}

const main = async () => {
  const date = new Date();
  versions.updated_at = [date.getFullYear(), date.getMonth()+1, date.getDate()].join('-')+' '+[date.getHours(),date.getMinutes(), date.getSeconds()].join(':');
  versions.version++;
  saveFile(__dirname + '/config/versions.json', versions);

  // Disconnect PG DB
  await PGDisconnect();

  // Connect to PG BD
  await PGConnect();

  // Run sync stores
  const syncStores = Object.keys(STORES).filter(key => !STORES[key].runAsync);
  for (let i=0; i<syncStores.length; i++) {
    const store = syncStores[i];
    if (
      ((filterStore !== '' && filterStore.includes(store)) || (filterStore === ''))
      && (excludedStores === '' || (excludedStores !== '' && !excludedStores.includes(store)))  
    ) 
    {
      await storesMain[store].main();
    }
  };

  let promises = [];
  // Run async first
  Object.keys(STORES).filter(key => STORES[key].runAsync).forEach(store => {
    if (
      ((filterStore !== '' && filterStore.includes(store)) || (filterStore === ''))
      && (excludedStores === '' || (excludedStores !== '' && !excludedStores.includes(store)))  
    ) {
      promises.push(storesMain[store].main());
    }
  });
  // Await async stores
  await Promise.all(promises);
  promises = [];
  await delay(60000 * 10);
  main();
}

const telegramReport = async () => {
  // Telegram report products
  reportProducts();
  setInterval(() => {
    reportProducts();
  }, 60000 * process.env.TELEBOT_TIME_INTERVAL);
}

if (process.env.MONGO_DB && process.env.MONGO_DB !== '') {
  mongoose.set('strictQuery', false);
  mongoose.connect(process.env.MONGO_DB,  { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    log.info(`Connection to the db established`);
    if (process.env.TELEBOT_API && process.env.TELEBOT_API !== '') telegramReport();
    main();
  });
} else {
  if (process.env.TELEBOT_API && process.env.TELEBOT_API !== '') telegramReport();
  main();
}