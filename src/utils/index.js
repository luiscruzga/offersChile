const fs = require('fs');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { parseHTML, DOMParser } = require('linkedom');

const DEFAULT_HEADERS = {
  'Accept': '*/*',
  'Accept-Encoding': 'gzip,deflate,compress',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 OPR/92.0.0.0'
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const replaceAll = (str, term, replacement) => {
  return str.replace(new RegExp(escapeRegExp(term), 'g'), replacement).trim();
};

const getDataUrl = async(url, runScripts=false, headers = DEFAULT_HEADERS) => {
  try {
    let dom;
    const body = await axios({
      method: 'GET',
      url,
      headers
    }).then(res => res.data);

    if (!runScripts) dom = parseHTML(body);
    else {
      const virtualConsole = new jsdom.VirtualConsole();
      dom = new JSDOM(body, { runScripts: "dangerously", displayErrors: false, virtualConsole });
    }
    let message;
    dom.window.onerror = (msg) => message = msg;
    
    return dom; 
  } catch (e) {
    return Promise.reject(e.message);
  }
}

const axiosGet = async(url, headers = {}) => {
  try {
    const data = await axios({
      method: 'GET',
      url,
      headers
    })
    .then(res => res.data);
    return data;
  } catch (err) {
    log.error(`[axiosGet][${url}]: `, err.message);
    return Promise.reject(err.message);
  }
}

const axiosPost = async(url, body, headers={}) => {
  try {
    const data = await axios({
      method: 'POST',
      url,
      data: body,
      headers
    }).then(res => res.data);
    return data;
  } catch (err) {
    log.error(`[axiosPost][${url}]: `, err.message);
    return Promise.reject(err.message);
  }
}

const axiosPostDom = async(url, body, headers={}) => {
  let dom;
  try {
    const params = new URLSearchParams();
    for (let key in body) {
      params.append(key, body[key]);
    }
    const data = await axios({
      method: 'POST',
      url,
      data: params,
      headers
    }).then(res => res.data);
    //fs.writeFileSync('pruebaabcdin.html', data);
    dom = new JSDOM(data);
    dom.dom.window.onerror = function (msg) {}
    return dom;
  } catch (err) {
    log.error(`[axiosPostDom][${url}]: `, err.message);
    return Promise.reject(err.message);
  }
}

const saveFile = (filename, data) => {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

const diffMinutes = (dt2, dt1) => {
  let diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

const delay = ms => new Promise(res => setTimeout(res, ms));

const transformPrice = (price) => parseInt((replaceAll(replaceAll(price.replace('$', ''), '.', ''),'\n', '')).trim());

const numberWithCommas = (number) => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const isNumeric = (value) => /^-?\d+$/.test(value);

const getCaptionForTelegram = (product) => {
  const date = new Date();
  return `${product.type === 'normalprice' ? 'CAMBIO DE PRECIO NORMAL ⬇' : ''}
- % dcto: ${product.discountpercentage}%
- Tienda: ${product.store}
- Producto: ${product.name}
- Marca: ${product.brand}
- Descuento: $${numberWithCommas(product.discount)}
- Precio Normal: ${product.type === 'difference' ? '$'+numberWithCommas(product.normalprice) : product.actualprice}
- Precio Oferta: $${numberWithCommas(product.offerprice)}
${product.cardprice !== 0 ? `- Precio Tarjeta: $${numberWithCommas(product.cardprice)}` : ''}
- Fecha: ${[date.getDate().toString().padStart(2,0), (date.getMonth()+1).toString().padStart(2,0), date.getFullYear()].join('-') + ' ' + [date.getHours().toString().padStart(2,0), date.getMinutes().toString().padStart(2,0)].join(':')}  
- URL: ${product.url}`;
}

module.exports = {
  replaceAll,
  getDataUrl,
  saveFile,
  diffMinutes,
  delay,
  axiosGet,
  axiosPost,
  axiosPostDom,
  transformPrice,
  numberWithCommas,
  isNumeric,
  getCaptionForTelegram,
}
