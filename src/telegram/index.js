let reportProducts;

if (process.env.TELEBOT_API && process.env.TELEBOT_API !== '') {
  const { PGConnectTelegram, PGDisconnectTelegram, getProductsToReport, saveReportedProduct } = require('../utils/pg');
  const { numberWithCommas, delay } = require('../utils/');
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
      const caption = `- % dcto: ${product.discountpercentage}%
  - Tienda: ${product.store}
  - Producto: ${product.name}
  - Marca: ${product.brand}
  - Descuento: $${numberWithCommas(product.discount)}
  - Precio Normal: $${numberWithCommas(product.normalprice)}
  - Precio Oferta: $${numberWithCommas(product.offerprice)}
  - Precio Tarjeta: $${numberWithCommas(product.cardprice)}
  - URL: ${product.url}`;
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