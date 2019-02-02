export const Audio = {
  config: {},
  source: undefined,
  state: {
    play: false,
    playFirst: true,
  },
  async playAudio() {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();

    const data = await fetch('./assets/music/sample.mp3');
    const buffer = await data.arrayBuffer();
    const decodeBuffer = await this.context.decodeAudioData(buffer);
    this.analyser = await this.context.createAnalyser();
    this.source = this.context.createBufferSource();

    this.source.buffer = decodeBuffer;
    this.source.connect(this.analyser);
    this.source.loop = true;

    await this.play();
    await this.stop();

  },
  draw() {
    this.analyser.fftSize = 2048;
    let bufferLength = this.analyser.frequencyBinCount;
    let value;
    let frequency = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(frequency);
    for(let i = 0; i < document.querySelectorAll('.js-visualizer__bar').length; i++){
      document.querySelectorAll('.js-visualizer__bar')[i].style.height = `${Math.pow(frequency[i], 1.5) * 0.2 - 300}px`;
    }
    setTimeout(() => {
      if(this.state.play){
        this.draw();
      }
    }, 50);
  },
  drawStop() {
    for(let i = 0; i < document.querySelectorAll('.js-visualizer__bar').length; i++){
      document.querySelectorAll('.js-visualizer__bar')[i].style.height = `1px`;
    }
  },
  play() {
    [...document.querySelectorAll('.js-play')].forEach((e) => {
      e.addEventListener('click', () => {
        this.source.connect(this.context.destination);
        if(this.state.playFirst){
          this.source.start(0);
          this.state.playFirst = false;
        }
        this.draw();
        this.state.play = true;
      });
    });
  },
  stop() {
    [...document.querySelectorAll('.js-stop')].forEach((e) => {
      e.addEventListener('click', () => {
        this.source.disconnect(this.context.destination);
        this.drawStop();
        this.state.play = false;
      });
    });
  },
  CreateBar() {
    for(let i = 0; i < 200; i++){
      document.querySelector('.js-visualizer').insertAdjacentHTML('beforeend', `<li class="js-visualizer__bar" data-visualizer="${i}"></li>`);
    }
  },
  init() {
    this.playAudio();
    this.CreateBar();
  }
};

