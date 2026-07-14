const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const music = qs("#bgMusic");
const preloader = qs("#preloader");
const loadProgress = qs("#loadProgress");
const loadText = qs("#loadText");
const lockScreen = qs("#lockScreen");
const unlockSite = qs("#unlockSite");
const lockTime = qs("#lockTime");
const musicToggle = qs("#musicToggle");
const skipIntro = qs("#skipIntro");
const progressBar = qs(".scroll-progress span");
const cursorGlow = qs(".cursor-glow");
const envelope = qs("#envelope");
const firstLetter = qs("#firstLetter");
const lightbox = qs("#lightbox");
const lightboxImg = qs("#lightbox img");
const skyCanvas = qs("#skyCanvas");
const fireworksCanvas = qs("#fireworksCanvas");
const chapterLinks = qsa(".chapter-nav a");
const letterModal = qs("#letterModal");
const letterModalTitle = qs("#letterModalTitle");
const letterModalMessage = qs("#letterModalMessage");
const finalGate = qs("#finalGate");
const finalPaper = qs("#finalPaper");
const openFinalLetter = qs("#openFinalLetter");
const heartToast = qs("#heartToast");

let started = false;
let typewriterQueue = new WeakSet();
let navSleepTimer;
let heartToastTimer;

document.body.classList.add("locked");

function updateLockTime() {
  const now = new Date();
  lockTime.textContent = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

updateLockTime();
window.setInterval(updateLockTime, 30000);

function preloadAssets() {
  const media = [
    ...qsa("img").map((item) => item.currentSrc || item.src),
    ...qsa("video source").map((item) => item.src),
    music.currentSrc || qs("source", music)?.src
  ].filter(Boolean);

  const uniqueMedia = [...new Set(media)];
  let loaded = 0;

  const markLoaded = () => {
    loaded += 1;
    const percent = Math.round((loaded / Math.max(1, uniqueMedia.length)) * 100);
    loadProgress.style.width = `${percent}%`;
    loadText.textContent = `${percent}%`;
    if (loaded >= uniqueMedia.length) {
      window.setTimeout(() => preloader.classList.add("hide"), 450);
    }
  };

  if (!uniqueMedia.length) {
    markLoaded();
    return;
  }

  uniqueMedia.forEach((src) => {
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(src);
    const isAudio = /\.(mp3|wav|m4a)(\?|$)/i.test(src);

    if (isVideo || isAudio) {
      fetch(src, { method: "HEAD" }).then(markLoaded).catch(markLoaded);
      return;
    }

    const img = new Image();
    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = src;
  });
}

window.addEventListener("load", preloadAssets);

unlockSite.addEventListener("click", () => {
  lockScreen.classList.add("hide");
  document.body.classList.remove("locked");
});

function startExperience() {
  if (started) return;
  started = true;
  music.play().then(() => {
    musicToggle.textContent = "Ⅱ";
    musicToggle.setAttribute("aria-label", "إيقاف الموسيقى");
  }).catch(() => {
    musicToggle.textContent = "♪";
  });
}

qs(".start-experience").addEventListener("click", () => {
  startExperience();
  qs(".movie-scene").scrollIntoView({ behavior: "smooth" });
});

musicToggle.addEventListener("click", () => {
  if (music.paused) {
    startExperience();
  } else {
    music.pause();
    musicToggle.textContent = "♪";
    musicToggle.setAttribute("aria-label", "تشغيل الموسيقى");
  }
});

skipIntro.addEventListener("click", () => {
  qs("#birthday").scrollIntoView({ behavior: "smooth" });
});

window.addEventListener("mousemove", (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

function updateProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const percent = scrollable <= 0 ? 0 : (window.scrollY / scrollable) * 100;
  progressBar.style.width = `${Math.min(100, percent)}%`;
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

function runTypewriter(element) {
  if (typewriterQueue.has(element)) return;
  typewriterQueue.add(element);
  const text = element.dataset.typewriter || "";
  element.textContent = "";
  let index = 0;
  const speed = element.classList.contains("final-type") ? 42 : 34;

  const tick = () => {
    element.textContent += text[index] || "";
    index += 1;
    if (index <= text.length) window.setTimeout(tick, speed);
  };
  tick();
}

function openEnvelope() {
  envelope.classList.add("open");
  firstLetter.classList.add("show");
  firstLetter.classList.add("in");
  window.setTimeout(() => {
    runTypewriter(qs("[data-typewriter]", firstLetter));
  }, 520);
}

envelope.addEventListener("click", openEnvelope);
envelope.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") openEnvelope();
});

qsa(".scene > *, .glass-panel, .timeline article, .reason-cards article").forEach((item) => {
  item.classList.add("reveal");
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("in");
    if (entry.target.matches(".final-paper") && !entry.target.classList.contains("final-paper-hidden")) {
      const target = qs(".final-type", entry.target);
      window.setTimeout(() => runTypewriter(target), 500);
    }
  });
}, { threshold: 0.18 });

qsa(".reveal, .final-paper").forEach((item) => revealObserver.observe(item));

qsa(".polaroid").forEach((button) => {
  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    button.style.transform = `translateY(-10px) rotate(0deg) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
  });

  button.addEventListener("click", () => {
    lightboxImg.src = button.dataset.full;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

qsa("video").forEach((video) => {
  video.addEventListener("play", () => {
    qsa("video").forEach((otherVideo) => {
      if (otherVideo !== video) otherVideo.pause();
    });
    if (!music.paused) music.volume = 0.18;
  });

  video.addEventListener("pause", () => {
    if (!qsa("video").some((item) => !item.paused)) music.volume = 1;
  });
});

qsa(".mini-letter").forEach((letter) => {
  letter.addEventListener("click", () => {
    letterModalTitle.textContent = letter.dataset.title;
    letterModalMessage.textContent = letter.dataset.message;
    letterModal.classList.add("open");
    letterModal.setAttribute("aria-hidden", "false");
  });
});

openFinalLetter.addEventListener("click", () => {
  finalGate.classList.add("hide");
  finalPaper.classList.remove("final-paper-hidden");
  finalPaper.classList.add("show-dramatic", "in");
  window.setTimeout(() => {
    runTypewriter(qs(".final-type", finalPaper));
  }, 650);
});

qsa(".hidden-heart").forEach((heart) => {
  heart.addEventListener("click", () => {
    heartToast.textContent = heart.dataset.message;
    heartToast.classList.add("show");
    window.clearTimeout(heartToastTimer);
    heartToastTimer = window.setTimeout(() => heartToast.classList.remove("show"), 2600);
  });
});

qs("button", letterModal).addEventListener("click", closeLetterModal);
letterModal.addEventListener("click", (event) => {
  if (event.target === letterModal) closeLetterModal();
});

qs("button", lightbox).addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
  if (event.key === "Escape") closeLetterModal();
});

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
}

function closeLetterModal() {
  letterModal.classList.remove("open");
  letterModal.setAttribute("aria-hidden", "true");
}

function updateCounter() {
  const start = new Date(qs(".counter").dataset.start).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - start);
  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  qs("#days").textContent = days;
  qs("#hours").textContent = hours.toString().padStart(2, "0");
  qs("#minutes").textContent = minutes.toString().padStart(2, "0");
  qs("#seconds").textContent = remainingSeconds.toString().padStart(2, "0");
}

updateCounter();
window.setInterval(updateCounter, 1000);

function updateAgeMoment() {
  const birthday = new Date(qs(".age-counter").dataset.birthday);
  const now = new Date();
  let years = now.getFullYear() - birthday.getFullYear();
  let months = now.getMonth() - birthday.getMonth();
  let days = now.getDate() - birthday.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  qs("#ageYears").textContent = Math.max(0, years);
  qs("#ageMonths").textContent = Math.max(0, months);
  qs("#ageDays").textContent = Math.max(0, days);
}

updateAgeMoment();
window.setInterval(updateAgeMoment, 60 * 60 * 1000);

const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

  if (!visible) return;
  chapterLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
  });
}, { threshold: [0.35, 0.55, 0.75] });

chapterLinks.forEach((link) => {
  const target = qs(link.getAttribute("href"));
  if (target) chapterObserver.observe(target);
});

function wakeChapterNav() {
  qs(".chapter-nav").classList.remove("nav-sleep");
  window.clearTimeout(navSleepTimer);
  if (window.matchMedia("(max-width: 620px)").matches) {
    navSleepTimer = window.setTimeout(() => qs(".chapter-nav").classList.add("nav-sleep"), 2600);
  }
}

["touchstart", "mousemove", "scroll", "click"].forEach((eventName) => {
  window.addEventListener(eventName, wakeChapterNav, { passive: true });
});

wakeChapterNav();

function setupStarfield() {
  const ctx = skyCanvas.getContext("2d");
  let stars = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    skyCanvas.width = window.innerWidth * dpr;
    skyCanvas.height = window.innerHeight * dpr;
    skyCanvas.style.width = `${window.innerWidth}px`;
    skyCanvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.floor(window.innerWidth / 5) }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      v: Math.random() * 0.18 + 0.04,
      glow: Math.random()
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach((star) => {
      star.y += star.v;
      star.glow += 0.015;
      if (star.y > window.innerHeight) star.y = -4;
      ctx.globalAlpha = 0.35 + Math.sin(star.glow) * 0.25;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}

function setupFireworks() {
  const ctx = fireworksCanvas.getContext("2d");
  const section = qs(".fireworks-scene");
  let particles = [];
  let active = false;

  function resize() {
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fireworksCanvas.width = rect.width * dpr;
    fireworksCanvas.height = rect.height * dpr;
    fireworksCanvas.style.width = `${rect.width}px`;
    fireworksCanvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burst() {
    const rect = fireworksCanvas.getBoundingClientRect();
    const x = Math.random() * rect.width;
    const y = Math.random() * rect.height * 0.55 + rect.height * 0.08;
    const colors = ["#ff5ea8", "#9b5cff", "#55c7ff", "#ffd68a", "#ffffff"];
    for (let i = 0; i < 46; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.2 + 1.4;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 70,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    particles = particles.filter((particle) => particle.life > 0);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.life -= 1;
      ctx.globalAlpha = particle.life / 70;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (active) requestAnimationFrame(draw);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || active) return;
      active = true;
      resize();
      draw();
      burst();
      window.setInterval(burst, 1100);
    });
  }, { threshold: 0.35 });

  observer.observe(section);
  window.addEventListener("resize", resize);
}

setupStarfield();
setupFireworks();
