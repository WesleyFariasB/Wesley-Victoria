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
  // Filled only when an audio file is present in the local project scan.
  const audioFiles = [];

  let audioElement = null;
  let lastFocusedElement = null;

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
        playAudio();
      },
      prefersReducedMotion ? 0 : 360,
    );

    window.setTimeout(
      () => transitionVeil.classList.remove("is-active"),
      prefersReducedMotion ? 0 : 980,
    );
  }

  function initializeAudio() {
    if (!audioFiles.length || !audioToggle) return;

    audioElement = new Audio(audioFiles[0]);
    audioElement.loop = true;
    audioElement.preload = "metadata";
    audioElement.addEventListener("canplaythrough", () => {
      audioToggle.hidden = false;
    }, { once: true });
    audioElement.addEventListener("error", () => {
      audioToggle.hidden = true;
      audioElement = null;
    }, { once: true });
    audioElement.load();
  }

  function playAudio() {
    if (!audioElement) return;

    audioElement.play()
      .then(() => {
        audioToggle.setAttribute("aria-label", "Desativar música");
        audioToggle.classList.add("is-playing");
      })
      .catch(() => {
        audioToggle.hidden = false;
        audioToggle.setAttribute("aria-label", "Ativar música");
      });
  }

  function toggleAudio() {
    if (!audioElement) return;

    if (audioElement.paused) {
      playAudio();
      return;
    }

    audioElement.pause();
    audioToggle.setAttribute("aria-label", "Ativar música");
    audioToggle.classList.remove("is-playing");
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
  initializeAudio();
  bindImageFallbacks();
  initializeObservers();
  bindInteractions();
})();
