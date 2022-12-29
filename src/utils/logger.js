const { createLogger, format, transports, addColors } = require('winston');
const { SPLAT } = require('triple-beam');
const { isObject } = require('lodash');
const { APP_NAME } = require('../config/config.json');

const formatObject = (param) => {
  if (isObject(param)) {
    return JSON.stringify(param);
  }
  return param;
}
const all = format((info) => {
  const splat = info[SPLAT] || [];
  const message = formatObject(info.message);
  const rest = splat.map(formatObject).join(' ');
  info.message = `${message} ${rest}`;
  return info;
});
const levelFilter = (level) =>
  format((info, opts) => {
     if (info.level != level) { return false; }
      return info;
  })();

const Logger = createLogger({
  levels: { error: 0, warn: 1, info: 2, end: 1 },
  format: format.combine(
    all(),
    format.simple(),
    format.timestamp({format: 'DD-MM-YYYY HH:mm:ss'}),
    format.json(),
    format.prettyPrint(),
    format.printf(info => `[${info.timestamp}]: ${formatObject(info.message)}`)
  ),
  transports: [
    new transports.File({
      level: 'info',
      maxSize: 5120000,
      maxFiles: 5,
      filename: `${__dirname}/../logs/${APP_NAME}-info.log`,
      format: format.combine(levelFilter('info'))
    }),
    new transports.Console({
      level: 'info',
      format: format.combine(
        levelFilter('info'),
        format.colorize({
          all: true
        })
      )
    }),
    new transports.File({
      level: 'error',
      maxSize: 5120000,
      maxFiles: 5,
      filename: `${__dirname}/../logs/${APP_NAME}-error.log`,
      format: format.combine(levelFilter('error'))
    }),
    new transports.File({
      level: 'end',
      maxSize: 5120000,
      maxFiles: 5,
      filename: `${__dirname}/../logs/${APP_NAME}-ends.log`,
      format: format.combine(levelFilter('end'))
    }),
    new transports.Console({
      level: 'end',
      format: format.combine(
        levelFilter('end'),
        format.colorize({
          all: true
        })
      )
    }),
  ]
});

addColors({
  error: 'red',
  warn: 'yellow',
  info: 'green',
  end: 'blue'
});

module.exports = {
  Logger
};