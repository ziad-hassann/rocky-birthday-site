const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const music = qs("#bgMusic");
const preloader = qs("#preloader");
const loadProgress = qs("#loadProgress");
const loadText = qs("#loadText");
const lockScreen = qs("#lockScreen");
const unlockSite = qs("#unlockSite");
const secretLogin = qs("#secretLogin");
const passwordYear = qs("#passwordYear");
const passwordMonth = qs("#passwordMonth");
const passwordDay = qs("#passwordDay");
const lockError = qs("#lockError");
const lockTime = qs("#lockTime");
const musicToggle = qs("#musicToggle");
const cinematicToggle = qs("#cinematicToggle");
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
const passwordInputs = qsa(".password-date input");
const memoryForm = qs("#memoryForm");
const memoryImage = qs("#memoryImage");
const memoryTitle = qs("#memoryTitle");
const memoryNote = qs("#memoryNote");
const memoryPreview = qs("#memoryPreview");
const memoryCardTitle = qs("#memoryCardTitle");
const memoryCardNote = qs("#memoryCardNote");
const clearMemory = qs("#clearMemory");
const memoryWall = qs("#memoryWall");

let started = false;
let userPausedMusic = false;
let typewriterQueue = new WeakSet();
let navSleepTimer;
let heartToastTimer;
let selectedMemoryImage = "";
let savedMemories = [];
let cinematicTimer;
let cinematicIndex = 0;
let cinematicRunning = false;

const fullMusicVolume = 1;
const videoMusicVolume = 0.18;
let musicResumeTimer;
const savedMemoryKey = "rockySavedMemories";
const oldSavedMemoryKey = "rockySavedMemory";
const cloudConfig = window.ROCKY_CLOUD || {};
const cloudEnabled = Boolean(
  window.supabase &&
  cloudConfig.supabaseUrl &&
  cloudConfig.supabaseAnonKey
);
const cloudClient = cloudEnabled
  ? window.supabase.createClient(cloudConfig.supabaseUrl, cloudConfig.supabaseAnonKey)
  : null;

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

function hidePreloader() {
  preloader.classList.add("hide");
}

window.setTimeout(hidePreloader, 4200);

function fetchWithTimeout(src, timeout = 1800) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  return fetch(src, { method: "HEAD", signal: controller.signal }).finally(() => {
    window.clearTimeout(timer);
  });
}

function preloadAssets() {
  const media = [
    ...qsa(".lock-phone img, .hero-media img").map((item) => item.currentSrc || item.src)
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
      fetchWithTimeout(src).then(markLoaded).catch(markLoaded);
      return;
    }

    const img = new Image();
    img.onload = markLoaded;
    img.onerror = markLoaded;
    img.src = src;
  });
}

window.addEventListener("load", preloadAssets);

function setupLazyMedia() {
  qsa("img").forEach((img, index) => {
    img.decoding = "async";
    if (index > 1 && !img.closest(".lock-phone, .hero-media")) {
      img.loading = "lazy";
    }
  });

  const lazyVideos = qsa("video");
  lazyVideos.forEach((video) => {
    video.preload = "none";
    qsa("source", video).forEach((source) => {
      source.dataset.src = source.src;
      source.removeAttribute("src");
    });
  });

  const loadVideo = (video) => {
    if (video.dataset.loaded === "true") return;
    qsa("source", video).forEach((source) => {
      if (source.dataset.src) source.src = source.dataset.src;
    });
    video.load();
    video.dataset.loaded = "true";
  };

  lazyVideos.forEach((video) => {
    video.addEventListener("pointerdown", () => loadVideo(video), { once: true });
  });

  if (!("IntersectionObserver" in window)) {
    lazyVideos.forEach(loadVideo);
    return;
  }

  const lazyVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      loadVideo(entry.target);
      lazyVideoObserver.unobserve(entry.target);
    });
  }, { rootMargin: "650px 0px" });

  lazyVideos.forEach((video) => lazyVideoObserver.observe(video));
}

setupLazyMedia();

function clearSavedPasswordFields() {
  passwordInputs.forEach((input) => {
    input.value = "";
  });
}

clearSavedPasswordFields();
window.addEventListener("pageshow", clearSavedPasswordFields);

passwordInputs.forEach((input, index, inputs) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (input.value.length >= input.maxLength && inputs[index + 1]) {
      inputs[index + 1].focus();
    }
  });
});

secretLogin.addEventListener("submit", (event) => {
  event.preventDefault();
  const year = passwordYear.value.trim();
  const month = passwordMonth.value.trim();
  const day = passwordDay.value.trim();

  if (year === "2006" && month === "7" && day === "22") {
    lockScreen.classList.add("hide");
    document.body.classList.remove("locked");
    lockError.textContent = "";
    return;
  }

  lockError.textContent = "كلمة السر مش صح";
  passwordYear.value = "";
  passwordMonth.value = "";
  passwordDay.value = "";
  passwordYear.focus();
  secretLogin.classList.remove("shake");
  void secretLogin.offsetWidth;
  secretLogin.classList.add("shake");
});

function hasPlayingVideo() {
  return qsa("video").some((item) => !item.paused && !item.ended);
}

function playMusicSoftlyIfNeeded() {
  if (userPausedMusic || !started) return;
  music.volume = hasPlayingVideo() ? videoMusicVolume : fullMusicVolume;
  music.play().catch(() => {});
}

function startExperience() {
  started = true;
  userPausedMusic = false;
  music.volume = hasPlayingVideo() ? videoMusicVolume : fullMusicVolume;
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
    userPausedMusic = true;
    music.pause();
    musicToggle.textContent = "♪";
    musicToggle.setAttribute("aria-label", "تشغيل الموسيقى");
  }
});

function stopCinematicMode() {
  cinematicRunning = false;
  window.clearTimeout(cinematicTimer);
  cinematicToggle.textContent = "▶";
  cinematicToggle.setAttribute("aria-label", "تشغيل العرض السينمائي");
  document.body.classList.remove("cinematic-mode");
}

function stepCinematicMode() {
  if (!cinematicRunning) return;

  const scenes = qsa("main > .scene");
  if (!scenes.length) return;

  const scene = scenes[cinematicIndex % scenes.length];
  scene.scrollIntoView({ behavior: "smooth", block: "start" });
  cinematicIndex += 1;

  const delay = scene.matches(".video-scene, .memory-scene, .final-letter-scene") ? 7200 : 5200;
  cinematicTimer = window.setTimeout(stepCinematicMode, delay);
}

function startCinematicMode() {
  startExperience();
  document.body.classList.add("cinematic-mode");
  cinematicToggle.textContent = "■";
  cinematicToggle.setAttribute("aria-label", "إيقاف العرض السينمائي");
  cinematicRunning = true;

  const scenes = qsa("main > .scene");
  const currentScene = scenes.findIndex((scene) => {
    const rect = scene.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.45 && rect.bottom >= window.innerHeight * 0.45;
  });
  cinematicIndex = Math.max(0, currentScene);
  stepCinematicMode();
}

cinematicToggle.addEventListener("click", () => {
  if (cinematicRunning) {
    stopCinematicMode();
    return;
  }
  startCinematicMode();
});

skipIntro.addEventListener("click", () => {
  stopCinematicMode();
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

  button.addEventListener("click", (event) => {
    createTapSparkles(event);
    lightboxImg.src = button.dataset.full;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

qsa(".filmstrip img, .memory-card").forEach((item) => {
  item.addEventListener("click", createTapSparkles);
});

qsa("video").forEach((video) => {
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  video.addEventListener("click", createTapSparkles);

  video.addEventListener("play", () => {
    qsa("video").forEach((otherVideo) => {
      if (otherVideo !== video) otherVideo.pause();
    });
    if (!userPausedMusic && started) {
      music.volume = videoMusicVolume;
      playMusicSoftlyIfNeeded();
      window.clearTimeout(musicResumeTimer);
      musicResumeTimer = window.setTimeout(playMusicSoftlyIfNeeded, 250);
    }
  });

  video.addEventListener("pause", () => {
    if (!hasPlayingVideo()) music.volume = fullMusicVolume;
  });

  video.addEventListener("ended", () => {
    if (!hasPlayingVideo()) music.volume = fullMusicVolume;
  });
});

music.addEventListener("pause", () => {
  if (userPausedMusic || !started || !hasPlayingVideo()) return;
  window.clearTimeout(musicResumeTimer);
  musicResumeTimer = window.setTimeout(playMusicSoftlyIfNeeded, 120);
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
  if (event.key === "Escape") stopCinematicMode();
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

function createTapSparkles(event) {
  const symbols = ["❤", "✦", "★", "♡"];
  const colors = ["#ffd68a", "#ff5ea8", "#55c7ff", "#ffffff"];

  for (let i = 0; i < 12; i += 1) {
    const sparkle = document.createElement("span");
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 42 + Math.random() * 58;
    sparkle.className = "tap-sparkle";
    sparkle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
    sparkle.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
    sparkle.style.setProperty("--spark-rotate", `${Math.random() * 160 - 80}deg`);
    sparkle.style.setProperty("--spark-size", `${15 + Math.random() * 14}px`);
    sparkle.style.setProperty("--spark-color", colors[Math.floor(Math.random() * colors.length)]);
    document.body.appendChild(sparkle);
    sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
  }
}

function showToast(message) {
  heartToast.textContent = message;
  heartToast.classList.add("show");
  window.clearTimeout(heartToastTimer);
  heartToastTimer = window.setTimeout(() => heartToast.classList.remove("show"), 2600);
}

function updateMemoryCard(memory = {}) {
  selectedMemoryImage = memory.image || selectedMemoryImage;
  if (memory.image) memoryPreview.src = memory.image;
  memoryCardTitle.textContent = memory.title || "ذكرى مستنية صورتك";
  memoryCardNote.textContent = memory.note || "ارفعي صورة واكتبي كلمة، وبعدها ضيفيها لحائط الذكريات.";
}

function readImageAsCard(file, maxSize = 1100, quality = 0.76) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function saveMemories() {
  localStorage.setItem(savedMemoryKey, JSON.stringify(savedMemories));
}

function normalizeMemory(memory) {
  return {
    id: memory.id || `${memory.createdAt || Date.now()}`,
    image: memory.image_url || memory.image,
    imagePath: memory.image_path || memory.imagePath || "",
    title: memory.title || "ذكرى محفوظة",
    note: memory.note || "لحظة حلوة اتضافت للموقع.",
    createdAt: memory.created_at || memory.createdAt || Date.now()
  };
}

async function uploadMemoryToCloud(memory) {
  const filePath = `memories/${Date.now()}-${Math.random().toString(16).slice(2)}.jpg`;
  const imageBlob = await fetch(memory.image).then((response) => response.blob());
  const storageResult = await cloudClient
    .storage
    .from(cloudConfig.bucket)
    .upload(filePath, imageBlob, {
      contentType: "image/jpeg",
      upsert: false
    });

  if (storageResult.error) throw storageResult.error;

  const publicImage = cloudClient
    .storage
    .from(cloudConfig.bucket)
    .getPublicUrl(filePath)
    .data
    .publicUrl;

  const insertResult = await cloudClient
    .from(cloudConfig.table)
    .insert({
      title: memory.title,
      note: memory.note,
      image_url: publicImage,
      image_path: filePath
    })
    .select()
    .single();

  if (insertResult.error) throw insertResult.error;
  return normalizeMemory(insertResult.data);
}

async function deleteMemoryFromCloud(memory) {
  if (memory.imagePath) {
    await cloudClient.storage.from(cloudConfig.bucket).remove([memory.imagePath]);
  }
  if (memory.id) {
    const result = await cloudClient.from(cloudConfig.table).delete().eq("id", memory.id);
    if (result.error) throw result.error;
  }
}

async function clearCloudMemories() {
  const memoriesToDelete = [...savedMemories];
  await Promise.all(memoriesToDelete.map(deleteMemoryFromCloud));
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      if (lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines += 1;
      return;
    }
    line = testLine;
  });

  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function downloadMemoryCard(memory) {
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const img = new Image();

  img.onload = () => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#130617");
    gradient.addColorStop(0.55, "#202043");
    gradient.addColorStop(1, "#3b1726");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    drawRoundedRect(ctx, 70, 70, 940, 1040, 34);
    ctx.clip();
    const scale = Math.max(940 / img.width, 1040 / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    ctx.drawImage(img, 70 + (940 - drawWidth) / 2, 70 + (1040 - drawHeight) / 2, drawWidth, drawHeight);
    ctx.restore();

    const fade = ctx.createLinearGradient(0, 780, 0, 1110);
    fade.addColorStop(0, "rgba(5, 8, 22, 0)");
    fade.addColorStop(1, "rgba(5, 8, 22, 0.86)");
    ctx.fillStyle = fade;
    ctx.fillRect(70, 780, 940, 330);

    ctx.fillStyle = "#ffd68a";
    ctx.font = "42px Cairo, Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Rocky memory", width / 2, 1198);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px Cairo, Tahoma, sans-serif";
    drawWrappedText(ctx, memory.title || "ذكرى محفوظة", width / 2, 1288, 850, 82, 2);

    ctx.fillStyle = "rgba(255, 248, 255, 0.82)";
    ctx.font = "38px Cairo, Tahoma, sans-serif";
    drawWrappedText(ctx, memory.note || "لحظة حلوة اتضافت للموقع.", width / 2, 1402, 820, 50, 2);

    const link = document.createElement("a");
    link.download = `${(memory.title || "rocky-memory").replace(/[^\w\u0600-\u06FF-]+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  img.src = memory.image;
}

function renderMemoryWall() {
  memoryWall.innerHTML = "";

  if (!savedMemories.length) {
    const empty = document.createElement("p");
    empty.className = "memory-empty";
    empty.textContent = "لسه مفيش ذكريات محفوظة. أول صورة هتبدأ الحائط.";
    memoryWall.appendChild(empty);
    return;
  }

  savedMemories.forEach((memory, index) => {
    const card = document.createElement("article");
    card.className = "wall-memory";
    card.innerHTML = `
      <img src="${memory.image}" alt="" loading="lazy" decoding="async">
      <div>
        <span>${new Date(memory.createdAt).toLocaleDateString("ar-EG")}</span>
        <h4></h4>
        <p></p>
        <div class="wall-actions">
          <button type="button" data-action="download">تحميل الكارت</button>
          <button type="button" data-action="delete">حذف</button>
        </div>
      </div>
    `;
    qs("h4", card).textContent = memory.title;
    qs("p", card).textContent = memory.note;
    card.addEventListener("click", createTapSparkles);
    qs('[data-action="download"]', card).addEventListener("click", (event) => {
      event.stopPropagation();
      downloadMemoryCard(memory);
    });
    qs('[data-action="delete"]', card).addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        if (cloudEnabled) {
          await deleteMemoryFromCloud(memory);
        }
        savedMemories.splice(index, 1);
        if (!cloudEnabled) saveMemories();
        renderMemoryWall();
        showToast("اتحذفت الذكرى");
      } catch (error) {
        showToast("الحذف محتاج اتصال أحسن");
      }
    });
    memoryWall.appendChild(card);
  });
}

async function loadSavedMemory() {
  try {
    if (cloudEnabled) {
      const cloudLoad = cloudClient
          .from(cloudConfig.table)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(24);
      const timeoutLoad = new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error("Cloud memories timed out")), 3500);
      });
      const result = await Promise.race([cloudLoad, timeoutLoad]);

      if (result.error) throw result.error;
      savedMemories = result.data.map(normalizeMemory);
      if (savedMemories[0]) updateMemoryCard(savedMemories[0]);
      renderMemoryWall();
      return;
    }

    const savedList = JSON.parse(localStorage.getItem(savedMemoryKey) || "[]");
    const oldMemory = JSON.parse(localStorage.getItem(oldSavedMemoryKey) || "null");
    savedMemories = Array.isArray(savedList) ? savedList.map(normalizeMemory) : [];
    if (!savedMemories.length && oldMemory?.image) {
      savedMemories = [normalizeMemory({ ...oldMemory, createdAt: Date.now() })];
      saveMemories();
      localStorage.removeItem(oldSavedMemoryKey);
    }
    if (savedMemories[0]) updateMemoryCard(savedMemories[0]);
    renderMemoryWall();
  } catch (error) {
    localStorage.removeItem(savedMemoryKey);
    savedMemories = [];
    renderMemoryWall();
  }
}

memoryImage.addEventListener("change", () => {
  const file = memoryImage.files?.[0];
  if (!file) return;

  readImageAsCard(file).then((image) => {
    selectedMemoryImage = image;
    memoryPreview.src = image;
    updateMemoryCard({
      image,
      title: memoryTitle.value.trim() || "ذكرى جديدة",
      note: memoryNote.value.trim() || "لسه متضافة حالا."
    });
  }).catch(() => {
    memoryCardNote.textContent = "الصورة دي مش نافعة، جربي صورة تانية.";
  });
});

memoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const memory = {
    image: selectedMemoryImage || memoryPreview.src,
    title: memoryTitle.value.trim() || "ذكرى محفوظة",
    note: memoryNote.value.trim() || "لحظة حلوة اتضافت للموقع.",
    createdAt: Date.now()
  };

  try {
    const savedMemory = cloudEnabled ? await uploadMemoryToCloud(memory) : normalizeMemory(memory);
    savedMemories.unshift(savedMemory);
    savedMemories = savedMemories.slice(0, cloudEnabled ? 24 : 12);
    if (!cloudEnabled) saveMemories();
    updateMemoryCard(savedMemory);
    renderMemoryWall();
    memoryForm.reset();
    showToast(cloudEnabled ? "اتحفظت وظهرت لكل الأجهزة" : "اتضافت محليًا لحد ما نوصل السحابة");
  } catch (error) {
    savedMemories.shift();
    memoryCardNote.textContent = cloudEnabled ? "الحفظ السحابي محتاج مراجعة الإعدادات أو النت." : "المساحة مش مكفية، جربي صورة أصغر.";
  }
});

clearMemory.addEventListener("click", async () => {
  try {
    if (cloudEnabled) {
      await clearCloudMemories();
    } else {
      localStorage.removeItem(savedMemoryKey);
    }
    savedMemories = [];
    selectedMemoryImage = "";
    memoryForm.reset();
    updateMemoryCard({
      image: "assets/images/gallery/WhatsApp Image 2026-07-14 at 2.50.19 PM.jpeg",
      title: "ذكرى مستنية صورتك",
      note: "ارفعي صورة واضغطي حفظ، وهتفضل موجودة هنا كل مرة تفتحي الموقع من نفس الجهاز."
    });
    renderMemoryWall();
    showToast("الحائط اتفضى");
  } catch (error) {
    showToast("مسح الحائط محتاج اتصال أحسن");
  }
});

loadSavedMemory();

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
  const seconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();

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
  qs("#ageSeconds").textContent = seconds.toLocaleString("ar-EG");

  qs("#lockAgeYears").textContent = Math.max(0, years);
  qs("#lockAgeMonths").textContent = Math.max(0, months);
  qs("#lockAgeDays").textContent = Math.max(0, days);
  qs("#lockAgeSeconds").textContent = seconds.toLocaleString("ar-EG");
}

updateAgeMoment();
window.setInterval(updateAgeMoment, 1000);

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
