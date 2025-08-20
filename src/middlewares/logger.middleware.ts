import winston = require('winston')
// const nrWinston = require('@newrelic/winston-enricher')

export const logger = winston.createLogger({
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    trace: 4,
    debug: 5,
  },
  level: 'info',
  // format: nrWinston(),
  transports: [new winston.transports.Console()],
})
