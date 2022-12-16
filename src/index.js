global.mongoose = require('mongoose');
const { MONGODB } = require('./config/config.json');
const { Logger } = require('./utils/logger');
global.log = Logger;
const versions = require('./config/versions.json');
const { saveFile } = require('./utils/');

const stores = require('./stores');
const filterStore = '';

const main = async () => {
  const date = new Date();
  versions.updated_at = [date.getFullYear(), date.getMonth()+1, date.getDate()].join('-')+' '+[date.getHours(),date.getMinutes(), date.getSeconds()].join(':');
  versions.version++;
  saveFile(__dirname + '/config/versions.json', versions);

  for (let key in stores) {
    if ((filterStore !== '' && filterStore === key) || (filterStore === '')) stores[key].main();
  }
}

mongoose.connect(MONGODB,  { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  log.info(`Connection to the db established`);
  main();
});