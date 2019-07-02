import * as Log from 'log4js';
Log.configure({
  appenders: {
    file: {
      type: 'file',
      filename: './spider.log'
    },
    console: {
      type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['file', 'console'],
      level: 'info'
    }
  }
});

export default function createLogger(name) {
  return Log.getLogger(name);
}