const root = document.documentElement;
const body = document.body;
const panels = [...document.querySelectorAll(".panel")];
const railButtons = [...document.querySelectorAll(".progress-rail button")];
const railFill = document.querySelector("[data-rail-fill]");
const jumpControls = [...document.querySelectorAll("[data-jump]")];
const siteChrome = document.querySelector("[data-chrome]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopMotion = window.matchMedia("(min-width: 861px)");

let observer = null;
let activeIndex = 0;
let programmaticJump = false;
let programmaticTimer = 0;
const panelTimelines = [];

function setActive(index, progress = index / Math.max(1, panels.length - 1)) {
  activeIndex = index;

  railButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === index);
  });

  panels.forEach((panel, panelIndex) => {
    panel.toggleAttribute("aria-current", panelIndex === index);
  });

  if (railFill) {
    railFill.style.height = `${Math.max(0, Math.min(100, progress * 100))}%`;
  }
}

function syncChrome() {
  siteChrome.classList.toggle("is-scrolled", window.scrollY > 20);
}

function canEnhance() {
  return Boolean(window.gsap && window.ScrollTrigger && !reduceMotion.matches && desktopMotion.matches);
}

function revealPanel(index) {
  if (panelTimelines[index]) {
    panelTimelines[index].restart();
  }
}

function activatePanel(index) {
  setActive(index);
  revealPanel(index);
}

function jumpTo(index) {
  const boundedIndex = Math.max(0, Math.min(panels.length - 1, index));

  clearTimeout(programmaticTimer);
  programmaticJump = true;
  activatePanel(boundedIndex);

  panels[boundedIndex].scrollIntoView({
    behavior: reduceMotion.matches ? "auto" : "smooth",
    block: "start"
  });

  programmaticTimer = window.setTimeout(() => {
    programmaticJump = false;
  }, reduceMotion.matches ? 80 : 850);
}

function setupObserver() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const index = panels.indexOf(visible.target);
      activatePanel(index);
    },
    { threshold: [0.52, 0.68, 0.84] }
  );

  panels.forEach((panel) => observer.observe(panel));
}

function setupSnapDeck() {
  root.classList.add("snap-enhanced");

  if (!canEnhance()) {
    setupObserver();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  panels.forEach((panel, index) => {
    const pieces = panel.querySelectorAll(".panel-copy > *, .portrait-system, .system-diagram, .agent-orbit, .gate-board, .proof-terminal, .contact-visual");
    gsap.set(pieces, { y: index === 0 ? 0 : 30, autoAlpha: index === 0 ? 1 : 0 });

    panelTimelines[index] = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" }
    }).to(pieces, {
      y: 0,
      autoAlpha: 1,
      stagger: 0.055,
      duration: 0.62,
      overwrite: true
    });

    if (index === 0) {
      panelTimelines[index].progress(1);
    }

    ScrollTrigger.create({
      trigger: panel,
      start: "top 52%",
      end: "bottom 48%",
      onEnter: () => activatePanel(index),
      onEnterBack: () => activatePanel(index)
    });
  });
}

jumpControls.forEach((control) => {
  control.addEventListener("click", (event) => {
    const index = Number(control.dataset.jump);
    if (!Number.isFinite(index)) return;
    event.preventDefault();
    jumpTo(index);
  });
});

syncChrome();
window.addEventListener("scroll", syncChrome, { passive: true });

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }, 140);
});

setupSnapDeck();
setActive(0);

const canvas = document.querySelector("#traceCanvas");
const ctx = canvas.getContext("2d");
const pointer = { x: -9999, y: -9999 };
let width = 0;
let height = 0;
let points = [];
let raf = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(34, Math.min(84, Math.floor(width / 18)));
  points = Array.from({ length: count }, (_, index) => ({
    x: (index * 137) % Math.max(width, 1),
    y: (index * 89) % Math.max(height, 1),
    vx: ((index % 9) - 4) * 0.04,
    vy: (((index + 3) % 7) - 3) * 0.035,
    r: 1 + ((index * 5) % 4) * 0.28
  }));
}

function drawTrace() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  points.forEach((point, index) => {
    if (!reduceMotion.matches) {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x < -24) point.x = width + 24;
      if (point.x > width + 24) point.x = -24;
      if (point.y < -24) point.y = height + 24;
      if (point.y > height + 24) point.y = -24;
    }

    const cursorDistance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    const glow = Math.max(0, 1 - cursorDistance / 190);

    for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
      const next = points[nextIndex];
      const distance = Math.hypot(point.x - next.x, point.y - next.y);
      if (distance < 132) {
        ctx.strokeStyle = `rgba(184, 244, 108, ${(1 - distance / 132) * 0.15})`;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = glow > 0 ? `rgba(93, 215, 255, ${0.24 + glow * 0.58})` : "rgba(247, 240, 230, 0.3)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.r + glow * 2.6, 0, Math.PI * 2);
    ctx.fill();
  });

  if (!reduceMotion.matches) {
    raf = requestAnimationFrame(drawTrace);
  }
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});

window.addEventListener("resize", () => {
  cancelAnimationFrame(raf);
  resizeCanvas();
  drawTrace();
});

resizeCanvas();
drawTrace();
