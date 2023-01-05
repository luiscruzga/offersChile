let reportProducts;

if (process.env.TELEBOT_API && process.env.TELEBOT_API !== '') {
  const {
    PGConnectTelegram,
    PGDisconnectTelegram,
    getProductsToReport,
    getProductsRandom,
    saveReportedProduct,
  } = require('../utils/pg');
  const { delay, getCaptionForTelegram, isNumeric } = require('../utils/');
  const telebot = require('telebot');
  const bot = new telebot({
    token: process.env.TELEBOT_API,
    usePlugins: ['regExpMessage'],
    polling: { 
      interval: 1000,
      timeout: 0,
      limit: 200,
      retryTimeout: 5000
    }
  });

  reportProducts = async () => {
    log.end('================================================================================');
    log.end(`Searching for products to report by telegram`);
    log.end('================================================================================');
    await PGConnectTelegram();
    const products = await getProductsToReport();

    for (let i = 0; i < products.length; i++) {
      await delay(2000);
      const product = products[i];
      const caption = getCaptionForTelegram(product);
      // SendPhoto to telegram channel
      if (product.thumbnail !== '') {
        const thumbnail = product.thumbnail.indexOf('https') == 0 ? product.thumbnail : `https:${product.thumbnail}`;
        await bot.sendPhoto(process.env.TELEBOT_CHAT_ID, thumbnail, { caption })
        .then(async (info) => {
          // Save product as reported
          await saveReportedProduct([product.store, product.name, product.brand, product.discountpercentage, product.discount, product.normalprice, product.offerprice, product.cardprice]);
        })
        .catch(async (error) => {
          log.error(`[ERROR][TELEGRAM][${product.store}][${product.name}][${thumbnail}]`, error.description);
          if (error.description.includes('Too Many Requests')) await delay(20000);
          if (error.description.includes('Bad Request')) {
            await bot.sendMessage(process.env.TELEBOT_CHAT_ID, caption)
            .then(async (info) => {
              // Save product as reported
              await saveReportedProduct([product.store, product.name, product.brand, product.discountpercentage, product.discount, product.normalprice, product.offerprice, product.cardprice]);
            })
            .catch(async (error) => {
              log.error(`[ERROR][TELEGRAM][${product.store}][${product.name}][${thumbnail}]`, error.description);
              if (error.description.includes('Too Many Requests')) await delay(20000);
            });    
          }
        });
      } else {
        await bot.sendMessage(process.env.TELEBOT_CHAT_ID, caption)
        .then(async (info) => {
          // Save product as reported
          await saveReportedProduct([product.store, product.name, product.brand, product.discountpercentage, product.discount, product.normalprice, product.offerprice, product.cardprice]);
        })
        .catch(async (error) => {
          log.error(`[ERROR][TELEGRAM][${product.store}][${product.name}][${thumbnail}]`, error.description);
          if (error.description.includes('Too Many Requests')) await delay(20000);
        });
      }
    }

    await PGDisconnectTelegram();

    log.end('================================================================================');
    log.end(`Products reported by telegram: ${products.length}`);
    log.end('================================================================================');
  }


  bot.on('/getId', (msg) => {
    console.log('/getId', msg.chat.id);
    return bot.sendMessage(msg.chat.id, `Chat ID: ${ msg.chat.id }`);
  });

  const lastMessages = [];
  const sendRandomProducts = async (msg, props, direct) => {
    if (lastMessages.indexOf(msg.message_id) === -1 && !direct) lastMessages.push(msg.message_id);
    else {
      const userId = msg.chat.id;
      const paramString = props.match && props.match.length > 0 ? props.match[1] : '';
      const percentageFilter = isNumeric(paramString.split(' ')[0])
        ? paramString.split(' ')[0]
        : isNumeric(paramString.split(' ').pop())
        ? paramString.split(' ').pop()
        : null;
      const searchFilter = percentageFilter === null && paramString !== ''
        ? paramString
        : percentageFilter !== null && paramString !== ''
        ? paramString.replace(percentageFilter, '').trim()
        : paramString;
      const username = !msg.from.first_name && !msg.from.last_name
        ? msg.from.username
        : (msg.from.first_name || '' + ' ' + msg.from.last_name || '').trim();
      log.end(`[TELEGRAM][COMMAND][/search][${userId}][${username}]`);
      await PGConnectTelegram();
      const products = await getProductsRandom(searchFilter, percentageFilter);
      for (let i = 0; i < products.length; i++) {
        await delay(2000);
        const product = products[i];
        const caption = getCaptionForTelegram(product);
        // SendPhoto to telegram channel
        if (product.thumbnail !== '') {
          const thumbnail = product.thumbnail.indexOf('https') == 0 ? product.thumbnail : `https:${product.thumbnail}`;
          await bot.sendPhoto(userId, thumbnail, { caption })
          .catch(async (error) => {
            if (error.description.includes('Too Many Requests')) await delay(20000);
            if (error.description.includes('Bad Request')) {
              await bot.sendMessage(userId, caption);    
            }
          });
        } else {
          await bot.sendMessage(userId, caption);
        }
      }
      
      if (products.length === 0) {
        await bot.sendMessage(userId, 'No se encontraron productos con los criterios especificados!');
      }
      await PGDisconnectTelegram();
      log.end(`[TELEGRAM][COMMAND][/search][${userId}][${username}]: Products reported: ${products.length}`);
    }
  }
  bot.on([/^\/search (.+)$/], async (msg, props) => {
    sendRandomProducts(msg, props);
  });

  bot.on('/search', (msg, props) => {
    sendRandomProducts(msg, props, true);
  });

  bot.start();
} else {
  reportProducts = async () => {
    log.end('================================================================================');
    log.end(`Api Key for telebot not found.`);
    log.end('================================================================================');
  }
}

module.exports = {
  reportProducts,
}