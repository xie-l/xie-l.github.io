// scripts/utils/logger.js
const fs = require('fs-extra');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.logLevel = options.level || 'info';
    this.logToFile = options.logToFile !== false;
    this.logToConsole = options.logToConsole !== false;
    this.logDir = options.logDir || './logs';
    this.maxLogSize = options.maxLogSize || '10MB';
    this.maxLogFiles = options.maxLogFiles || 5;
    
    fs.ensureDirSync(this.logDir);
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    const formattedMessage = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (this.logToConsole) {
      console.log(formattedMessage);
    }
    
    if (this.logToFile) {
      this.writeToFile(logEntry);
    }
  }

  info(message, meta) { this.log('info', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  error(message, meta) { this.log('error', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }

  writeToFile(logEntry) {
    const logFile = path.join(this.logDir, 'obsidian-sync.log');
    const errorFile = path.join(this.logDir, 'errors.log');
    
    const line = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, line);
    
    if (logEntry.level === 'ERROR') {
      fs.appendFileSync(errorFile, line);
    }
  }
}

module.exports = Logger;
