(() => {
  const viewer = document.querySelector('#viewer');
  const allWorks = [...document.querySelectorAll('.artwork')];
  if (!viewer || !allWorks.length || typeof viewer.showModal !== 'function') return;
  const image = document.querySelector('#viewer-image');
  const status = document.querySelector('#viewer-status');
  const caption = document.querySelector('#viewer-caption');
  const counter = document.querySelector('#viewer-counter');
  const close = document.querySelector('#close-viewer');
  const fullscreen = document.querySelector('#fullscreen');
  let works = allWorks;
  let current = 0;
  let opener;
  let request = 0;
  let previousOverflow = '';
  let cssFullscreen = false;
  const visibleWorks = () => allWorks.filter(work => !work.closest('.portfolio-group').hidden);
  const nativeFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const isFullscreen = () => cssFullscreen || Boolean(nativeFullscreenElement());
  const updateFullscreenButton = () => {
    const active = isFullscreen();
    fullscreen.textContent = active ? '退出全螢幕' : '全螢幕';
    fullscreen.setAttribute('aria-pressed', String(active));
  };
  const setCssFullscreen = active => {
    cssFullscreen = active;
    viewer.classList.toggle('viewer-css-fullscreen', active);
    document.body.classList.toggle('viewer-css-fullscreen-active', active);
    updateFullscreenButton();
  };
  const enterNativeFullscreen = async () => {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({navigationUI:'hide'});
      return true;
    }
    if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
      return true;
    }
    return false;
  };
  const exitNativeFullscreen = async () => {
    if (document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (document.webkitExitFullscreen && document.webkitFullscreenElement) document.webkitExitFullscreen();
  };
  function show(index) {
    current = (index + works.length) % works.length;
    const work = works[current];
    const token = ++request;
    caption.textContent = work.dataset.title;
    counter.textContent = (current + 1) + ' / ' + works.length;
    image.alt = work.dataset.title;
    image.src = work.querySelector('img').src;
    status.textContent = '原圖載入中…';
    const original = new Image();
    original.onload = () => {
      if (token !== request || !viewer.open) return;
      image.src = original.src;
      status.textContent = '';
    };
    original.onerror = () => {
      if (token === request && viewer.open) status.textContent = '原圖暫時無法載入，顯示預覽圖。';
    };
    original.src = work.href;
  }
  allWorks.forEach(work => work.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = work;
    works = visibleWorks();
    previousOverflow = document.body.style.overflow;
    viewer.showModal();
    document.body.style.overflow = 'hidden';
    show(works.indexOf(work));
    close.focus();
  }));
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', () => {
    request++;
    image.removeAttribute('src');
    document.body.style.overflow = previousOverflow;
    if (cssFullscreen) setCssFullscreen(false);
    else if (nativeFullscreenElement()) exitNativeFullscreen().catch(() => {});
    opener?.focus({preventScroll:true});
  });
  document.querySelector('#previous').addEventListener('click', () => show(current - 1));
  document.querySelector('#next').addEventListener('click', () => show(current + 1));
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  fullscreen.hidden = false;
  updateFullscreenButton();
  fullscreen.addEventListener('click', async () => {
    try {
      if (isFullscreen()) {
        if (cssFullscreen) setCssFullscreen(false);
        else await exitNativeFullscreen();
      } else if (!await enterNativeFullscreen()) {
        setCssFullscreen(true);
      }
      status.textContent = '';
      updateFullscreenButton();
    } catch {
      setCssFullscreen(true);
      status.textContent = '';
    }
  });
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
  let touchStart;
  const stage = document.querySelector('.viewer-stage');
  stage.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
  }, {passive:true});
  stage.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5 && (window.visualViewport?.scale || 1) <= 1) show(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
  stage.addEventListener('touchcancel', () => {touchStart=null;}, {passive:true});
  const filters = document.querySelector('.filters');
  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('button[data-filter]');
      if (!button) return;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      document.querySelectorAll('.portfolio-group').forEach(group => {
        group.hidden = button.dataset.filter !== 'all' && group.dataset.group !== button.dataset.filter;
      });
      document.querySelector('.result-count').textContent = '共 ' + visibleWorks().length + ' 件作品';
    });
  }
})();
