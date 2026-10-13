(() => {
  const toggle = document.querySelector('[data-audio-toggle]');
  const audio = document.querySelector('#portfolioAudio');
  if (!toggle || !audio) return;

  let soundOn = false;
  audio.src = './assets/ambient-cinematic-portfolio.mp3';
  audio.preload = 'metadata';
  audio.loop = true;
  audio.muted = true;
  audio.volume = 0;
  audio.disableRemotePlayback = true;

  const updateAudioButton = () => {
    const slash = toggle.querySelector('[data-audio-slash]');
    const label = soundOn ? '關閉背景音樂' : '開啟背景音樂';
    if (slash) slash.hidden = soundOn;
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-pressed', String(soundOn));
  };

  const stopAudio = () => {
    audio.pause();
    audio.muted = true;
    audio.volume = 0;
    soundOn = false;
    updateAudioButton();
  };

  const startAudio = async () => {
    audio.muted = false;
    audio.volume = 0.28;
    try {
      await audio.play();
      soundOn = !audio.paused && !audio.muted;
    } catch {
      stopAudio();
      return;
    }
    updateAudioButton();
  };

  toggle.addEventListener('click', () => {
    if (soundOn) stopAudio();
    else startAudio();
  });
  audio.addEventListener('play', () => {
    soundOn = !audio.muted;
    updateAudioButton();
  });
  audio.addEventListener('pause', () => {
    if (audio.ended || !soundOn) stopAudio();
  });
  audio.addEventListener('error', stopAudio);
  updateAudioButton();
})();
