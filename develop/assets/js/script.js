/*
* partsフォルダの中の記述をインポートしています。
* */
import '@babel/polyfill'
import {Audio} from './parts/audio';

document.addEventListener('DOMContentLoaded', () => {
  On.ready();
  Audio.init();
});
document.addEventListener('onLoad', () => {
  On.load();
});

const On = {
  wrap: '.js-wrap',
  ready() {
    document.querySelector(this.wrap).classList.add('is-ready');
  },
  load() {
    document.querySelector(this.wrap).classList.add('is-load');
  }
};
