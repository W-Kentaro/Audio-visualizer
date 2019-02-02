const developPath = {
  dev: `${__dirname}/develop/assets/js/`,
  output: `${__dirname}/public/assets/js/`
};

const webpack = require('webpack');
const path = require('path');
const glob = require('glob');

const scripts = glob.sync(`${developPath.dev}*.js`);

const entries = {};
scripts.forEach(value => {
  const re = new RegExp(`${developPath.dev.replace(/\\/g, '/')}`);
  const key = value.replace(re, '');
  entries[key] = value;
});

const config = {
  mode: 'production',
  // mode: 'development',
  entry: entries,
  output: {
    path: developPath.output,
    filename: '[name]',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules\/(?!(dom7|ssr-window|swiper)\/).*/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['env',
                  {
                    'targets': {'ie': 11},
                  }]
              ]
            }
          }
        ],
      }
    ]
  }
};

module.exports = config;