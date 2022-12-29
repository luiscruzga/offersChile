const fs = require('fs');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

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
  let dom;
  try {
    //const body = await axios.get(url).then(res => res.data);
    const body = await axios({
      method: 'GET',
      url,
      headers
    }).then(res => res.data);

    if (!runScripts) dom = new JSDOM(body);
    else {
      const virtualConsole = new jsdom.VirtualConsole();
      dom = new JSDOM(body, { runScripts: "dangerously", displayErrors: false, virtualConsole });
    }
    dom.window.onerror = (msg) => {console.log('');}
  } catch (e) {
    log.error(e.message);
  }

  return dom;
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
    return Promise.reject(err);
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
    return Promise.reject(err);
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
    dom.window.onerror = function (msg) {}
    return dom;
  } catch (err) {
    return Promise.reject(err);
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
}
