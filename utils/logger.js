const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',  // Lowest level of messages to log
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  ),
  transports: [
    // Console transport for logging in the console
    // new winston.transports.Console({
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     winston.format.simple()
    //   )
    // }),
    // File transport for errors
    new winston.transports.File({
      filename: 'errors.log',
      level: 'error',  // Only logs messages with level 'error'
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
      )
    }),
    // File transport for warnings
    new winston.transports.File({
      filename: 'warnings.log',
      level: 'warn',  // Only logs messages with level 'warn'
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.json()
      )
    })
  ],
});

module.exports = logger;