(() => {
  "use strict";

  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chapters = Array.from(document.querySelectorAll(".chapter"));
  const revealTargets = [...chapters, document.querySelector(".finale")].filter(Boolean);
  const startButton = document.getElementById("startExperience");
  const replayButton = document.getElementById("replayStory");
  const transitionVeil = document.getElementById("transitionVeil");
  const letterModal = document.getElementById("letterModal");
  const openLetterButton = document.getElementById("openLetter");
  const audioToggle = document.getElementById("audioToggle");
  const skipLink = document.querySelector(".skip-link");
  const youtubeContainerId = "youtubeAudioPlayer";
  const youtubeVideoId = "nGGxZe3I2DE";

  const audioIcons = {
    off: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
        <path d="M16 9.5 21 14.5"></path>
        <path d="m21 9.5-5 5"></path>
      </svg>
    `,
    on: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5Z"></path>
        <path d="M15.5 8.5a5 5 0 0 1 0 7"></path>
        <path d="M18.5 5.5a9 9 0 0 1 0 13"></path>
      </svg>
    `,
  };

  let lastFocusedElement = null;
  let youtubePlayer = null;
  let youtubeReady = false;
  let youtubeApiLoading = false;
  let audioShouldPlay = false;
  let audioIsPlaying = false;

  const removeLoader = () => body.classList.remove("is-loading");
  window.addEventListener("load", () => window.setTimeout(removeLoader, prefersReducedMotion ? 0 : 650));
  window.setTimeout(removeLoader, 1400);

  function createParticles() {
    const field = document.getElementById("particleField");
    if (!field) return;

    const amount = prefersReducedMotion ? 16 : 42;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < amount; index += 1) {
      const particle = document.createElement("span");
      const size = 1 + Math.random() * 2.6;
      particle.style.setProperty("--x", `${4 + Math.random() * 92}%`);
      particle.style.setProperty("--y", `${4 + Math.random() * 92}%`);
      particle.style.setProperty("--s", `${size}px`);
      particle.style.setProperty("--o", `${0.22 + Math.random() * 0.58}`);
      particle.style.setProperty("--d", `${5 + Math.random() * 7}s`);
      particle.style.setProperty("--delay", `${Math.random() * -8}s`);
      fragment.appendChild(particle);
    }

    field.appendChild(fragment);
  }

  function scrollToElement(element, block = "start") {
    if (!element) return;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block,
    });
  }

  function revealExperience(target) {
    transitionVeil.classList.add("is-active");

    window.setTimeout(
      () => {
        body.classList.remove("not-started");
        body.classList.add("experience-started");
        scrollToElement(target);
      },
      prefersReducedMotion ? 0 : 360,
    );

    window.setTimeout(
      () => transitionVeil.classList.remove("is-active"),
      prefersReducedMotion ? 0 : 980,
    );
  }

  function setAudioButtonState(isPlaying, label) {
    if (!audioToggle) return;

    audioIsPlaying = isPlaying;
    audioToggle.innerHTML = isPlaying ? audioIcons.on : audioIcons.off;
    audioToggle.classList.toggle("is-playing", isPlaying);
    audioToggle.setAttribute("aria-pressed", String(isPlaying));
    audioToggle.setAttribute("aria-label", label || (isPlaying ? "Pausar música" : "Ativar música"));
    audioToggle.title = label || (isPlaying ? "Pausar música" : "Ativar música");
  }

  function loadYouTubeApi() {
    if (!audioToggle) return;

    if (window.YT?.Player) {
      createYouTubePlayer();
      return;
    }

    if (youtubeApiLoading) return;
    youtubeApiLoading = true;

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") previousReady();
      createYouTubePlayer();
    };

    const existingScript = document.querySelector("script[src='https://www.youtube.com/iframe_api']");
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      youtubeApiLoading = false;
      setAudioButtonState(false, "Música indisponível");
    };
    document.head.appendChild(script);
  }

  function createYouTubePlayer() {
    const container = document.getElementById(youtubeContainerId);
    if (youtubePlayer || !container || !window.YT?.Player) return;

    youtubePlayer = new window.YT.Player(youtubeContainerId, {
      width: 200,
      height: 200,
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        loop: 1,
        modestbranding: 1,
        playsinline: 1,
        playlist: youtubeVideoId,
        rel: 0,
      },
      events: {
        onReady: handleYouTubeReady,
        onStateChange: handleYouTubeStateChange,
        onError: handleYouTubeError,
      },
    });
  }

  function handleYouTubeReady(event) {
    youtubeReady = true;
    youtubeApiLoading = false;

    if (typeof event.target.setLoop === "function") {
      event.target.setLoop(true);
    }

    if (audioShouldPlay) {
      playAudio();
    } else {
      setAudioButtonState(false);
    }
  }

  function handleYouTubeStateChange(event) {
    const PlayerState = window.YT?.PlayerState;
    if (!PlayerState) return;

    if (event.data === PlayerState.PLAYING) {
      audioShouldPlay = true;
      setAudioButtonState(true);
      return;
    }

    if (event.data === PlayerState.PAUSED) {
      setAudioButtonState(false);
      return;
    }

    if (event.data === PlayerState.ENDED) {
      if (audioShouldPlay && event.target?.playVideo) {
        event.target.seekTo?.(0);
        event.target.playVideo();
      } else {
        setAudioButtonState(false);
      }
    }
  }

  function handleYouTubeError() {
    audioShouldPlay = false;
    setAudioButtonState(false, "Música indisponível");
  }

  function playAudio() {
    audioShouldPlay = true;

    if (!youtubePlayer || !youtubeReady) {
      setAudioButtonState(false, "Carregando música");
      loadYouTubeApi();
      return;
    }

    try {
      youtubePlayer.unMute?.();
      youtubePlayer.setLoop?.(true);
      youtubePlayer.playVideo?.();
    } catch {
      audioShouldPlay = false;
      setAudioButtonState(false, "Música indisponível");
    }
  }

  function pauseAudio() {
    audioShouldPlay = false;

    try {
      youtubePlayer?.pauseVideo?.();
    } catch {
      // Keep the button usable even if the embedded player is temporarily unavailable.
    }

    setAudioButtonState(false);
  }

  function toggleAudio() {
    if (audioIsPlaying) {
      pauseAudio();
      return;
    }

    playAudio();
  }

  function bindImageFallbacks() {
    document.querySelectorAll(".photo-card img").forEach((image) => {
      image.addEventListener("error", () => {
        image.closest(".photo-card")?.classList.add("is-missing");
      });
    });
  }

  function initializeObservers() {
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    }, {
      threshold: 0.22,
      rootMargin: "0px 0px -8% 0px",
    });

    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  function openLetter() {
    if (!letterModal) return;

    lastFocusedElement = document.activeElement;
    letterModal.hidden = false;
    body.classList.add("modal-open");

    window.requestAnimationFrame(() => {
      letterModal.classList.add("is-open");
      letterModal.querySelector(".letter")?.focus();
    });

    document.addEventListener("keydown", handleModalKeydown);
  }

  function closeLetter() {
    if (!letterModal || letterModal.hidden) return;

    letterModal.classList.remove("is-open");
    body.classList.remove("modal-open");
    document.removeEventListener("keydown", handleModalKeydown);

    window.setTimeout(() => {
      letterModal.hidden = true;
      lastFocusedElement?.focus?.();
    }, prefersReducedMotion ? 0 : 220);
  }

  function trapFocus(event) {
    const focusable = Array.from(
      letterModal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"),
    ).filter((element) => !element.hasAttribute("disabled"));

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleModalKeydown(event) {
    if (event.key === "Escape") {
      closeLetter();
      return;
    }

    if (event.key === "Tab") {
      trapFocus(event);
    }
  }

  function bindInteractions() {
    startButton?.addEventListener("click", (event) => {
      event.preventDefault();
      revealExperience(document.getElementById("amor"));
    });

    skipLink?.addEventListener("click", (event) => {
      event.preventDefault();
      body.classList.remove("not-started");
      body.classList.add("experience-started");
      scrollToElement(document.getElementById("amor"));
    });

    replayButton?.addEventListener("click", () => {
      transitionVeil.classList.add("is-active");

      window.setTimeout(
        () => {
          window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
          body.classList.add("not-started");
          body.classList.remove("experience-started");
          startButton?.focus({ preventScroll: true });
        },
        prefersReducedMotion ? 0 : 320,
      );

      window.setTimeout(
        () => transitionVeil.classList.remove("is-active"),
        prefersReducedMotion ? 0 : 920,
      );
    });

    openLetterButton?.addEventListener("click", openLetter);
    audioToggle?.addEventListener("click", toggleAudio);

    letterModal?.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.hasAttribute("data-close-letter")) {
        closeLetter();
      }
    });
  }

  createParticles();
  setAudioButtonState(false);
  loadYouTubeApi();
  bindImageFallbacks();
  initializeObservers();
  bindInteractions();
})();
