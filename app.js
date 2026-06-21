const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const canvas = document.getElementById("signalCanvas");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 24);
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

function setMenuOpen(open) {
  header?.classList.toggle("is-menu-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  setMenuOpen(!isOpen);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

document.addEventListener("click", (event) => {
  if (!header || !menuToggle || !nav) return;
  if (!header.classList.contains("is-menu-open")) return;
  if (header.contains(event.target)) return;
  setMenuOpen(false);
});

if (canvas && !reduceMotion) {
  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let points = [];
  let frame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const count = Math.max(28, Math.floor(width / 34));
    points = Array.from({ length: count }, (_, index) => ({
      x: (index / count) * width + Math.random() * 30,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.22,
      vy: 0.12 + Math.random() * 0.22,
      r: 1 + Math.random() * 1.8
    }));
  }

  function draw() {
    frame += 1;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (const point of points) {
      point.x += point.vx;
      point.y += point.vy;

      if (point.y > height + 20) point.y = -20;
      if (point.x < -20) point.x = width + 20;
      if (point.x > width + 20) point.x = -20;

      ctx.beginPath();
      ctx.fillStyle = "rgba(125, 211, 252, 0.55)";
      ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 145) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(125, 211, 252, ${0.16 * (1 - distance / 145)})`;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (frame % 2 === 0) {
      requestAnimationFrame(draw);
    } else {
      requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize);
  resize();
  draw();
}

if ("IntersectionObserver" in window && !reduceMotion) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }
          );
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document
    .querySelectorAll(".arc-card, .pillar-card, .case-card, .timeline li, .project-card, .note-grid article")
    .forEach((item) => observer.observe(item));
}
