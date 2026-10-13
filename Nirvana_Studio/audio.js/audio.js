(() => {
  const toggle = document.querySelector('[data-audio-toggle]');
  const audio = document.querySelector('#portfolioAudio');
  if (!toggle || !audio) return;

  let soundOn = false;
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

  const setAudio = async enabled => {
    if (!enabled) {
      audio.pause();
      audio.muted = true;
      audio.volume = 0;
      soundOn = false;
      updateAudioButton();
      return;
    }

    audio.muted = false;
    audio.volume = 0.28;
    try {
      await audio.play();
      soundOn = true;
    } catch {
      audio.muted = true;
      audio.volume = 0;
      soundOn = false;
    }
    updateAudioButton();
  };

  toggle.addEventListener('click', () => setAudio(!soundOn));
  audio.addEventListener('volumechange', () => {
    soundOn = !audio.muted && audio.volume > 0 && !audio.paused;
    updateAudioButton();
  });
  updateAudioButton();
})();
