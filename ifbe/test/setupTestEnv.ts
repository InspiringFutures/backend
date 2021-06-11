require('dotenv').config( {path: './.env.test'});
require('dotenv').config( {path: './test/.env.test'});
require('dotenv').config( {path: process.env.CONFIG_SOURCE});

module.exports = () => {
  if (process.env.DB_PORT !== '5430') {
    process.exit(9);
  }
};
