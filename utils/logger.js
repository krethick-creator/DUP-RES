const path = require('path');

class Logger {
  static get isDebugEnabled() {
    return process.env.DEBUG === 'true';
  }

  static info(...args) {
    if (this.isDebugEnabled) {
      console.log(...args);
    }
  }

  static warn(...args) {
    if (this.isDebugEnabled) {
      console.warn(...args);
    }
  }

  static error(...args) {
    console.error(...args);
  }

  static debug(...args) {
    if (this.isDebugEnabled) {
      console.log(...args);
    }
  }

  static pipeline(step) {
    if (this.isDebugEnabled) {
      console.log('=========================');
      console.log('PIPELINE STEP');
      console.log('=========================');
      console.log('\nStage:');
      console.log(step.stage || '');
      console.log('\nInput:');
      console.log(step.input || '');
      console.log('\nOutput:');
      console.log(step.output || '');
      console.log('\nStatus:');
      console.log(step.status || '');
      console.log('\nReason:');
      console.log(step.reason || '');
      console.log('\n=========================');
    }
  }

  static startup(message) {
    if (this.isDebugEnabled) {
      console.log(message);
    }
  }

  static gateway(message) {
    if (this.isDebugEnabled) {
      console.log(message);
    }
  }

  static ocr(message) {
    if (this.isDebugEnabled) {
      console.log(message);
    }
  }

  static ocrWarn(message) {
    if (this.isDebugEnabled) {
      console.warn(message);
    }
  }

  static resume(message) {
    if (this.isDebugEnabled) {
      console.log(message);
    }
  }
}

module.exports = Logger;
