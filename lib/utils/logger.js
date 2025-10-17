const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * Logger utility for the mutation testing system
 * Enhanced version with configuration support
 */
class Logger {
  constructor(config = {}) {
    const logDir = path.dirname(config.file || 'logs/mutation-testing.log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports = [];

    if (config.console !== false) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(
              ({ timestamp, level, message, ...meta }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                  msg += ` ${JSON.stringify(meta)}`;
                }
                return msg;
              }
            )
          ),
        })
      );
    }

    if (config.file) {
      transports.push(
        new winston.transports.File({
          filename: config.file,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: config.level || 'info',
      transports,
    });

    this.config = config;
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Configure logger with new settings
   * @param {Object} config - Logger configuration
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Recreate logger with new configuration
    const logDir = path.dirname(this.config.file || 'logs/mutation-testing.log');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const transports = [];

    if (this.config.console !== false) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(
              ({ timestamp, level, message, ...meta }) => {
                let msg = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                  msg += ` ${JSON.stringify(meta)}`;
                }
                return msg;
              }
            )
          ),
        })
      );
    }

    if (this.config.file) {
      transports.push(
        new winston.transports.File({
          filename: this.config.file,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.json()
          ),
        })
      );
    }

    this.logger = winston.createLogger({
      level: this.config.level || 'info',
      transports,
    });
  }
}

// Create a default logger instance
const defaultLogger = new Logger();

module.exports = defaultLogger;