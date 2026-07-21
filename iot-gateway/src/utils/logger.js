const info = (msg) => {
  const time = new Date().toISOString();
  console.log(`[${time}] [INFO]  ${msg}`);
};

const warn = (msg) => {
  const time = new Date().toISOString();
  console.warn(`[${time}] [WARN]  ${msg}`);
};

const error = (msg) => {
  const time = new Date().toISOString();
  console.error(`[${time}] [ERROR] ${msg}`);
};

const debug = (msg) => {
  if (process.env.NODE_ENV !== 'production') {
    const time = new Date().toISOString();
    console.log(`[${time}] [DEBUG] ${msg}`);
  }
};

module.exports = {
  info,
  warn,
  error,
  debug
};
