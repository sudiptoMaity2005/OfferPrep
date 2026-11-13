import confetti from "canvas-confetti";

export function triggerConfetti() {
  if (typeof window === "undefined") return;

  // Initial burst
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.65 },
  });

  // Second celebratory burst with slightly different angles
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });
  }, 250);
}

