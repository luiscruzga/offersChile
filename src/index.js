require('dotenv').config();
global.mongoose = require('mongoose');
const { Logger } = require('./utils/logger');
const { PGConnect, PGDisconnect } = require('./utils/pg');
global.log = Logger;
const versions = require('./config/versions.json');
const { saveFile } = require('./utils/');
const { reportProducts } = require('./telegram/');

const stores = require('./stores');
let filterStore = process.env.FILTER_STORE || '';
if (filterStore !== '') {
  filterStore = filterStore.split(';')
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
  for (let key in stores) {
    if ((filterStore !== '' && filterStore.includes(key)) || (filterStore === '')) stores[key].main();
  }
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
    setInterval(() => {
      main();
    }, 60000 * process.env.INTERVAL_MAIN);
  });
} else {
  if (process.env.TELEBOT_API && process.env.TELEBOT_API !== '') telegramReport();

  main();
  setInterval(() => {
    main();
  }, 60000 * process.env.INTERVAL_MAIN);
}