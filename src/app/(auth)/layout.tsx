"use client";

import { useEffect, useRef } from "react";

function AnimatedOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    const orbs = [
      { x: width * 0.2, y: height * 0.3, r: 280, color: "rgba(43, 43, 238, 0.12)", vx: 0.3, vy: 0.2, phase: 0 },
      { x: width * 0.8, y: height * 0.7, r: 320, color: "rgba(30, 30, 189, 0.08)", vx: -0.25, vy: 0.15, phase: 2 },
      { x: width * 0.5, y: height * 0.2, r: 200, color: "rgba(100, 100, 255, 0.10)", vx: 0.2, vy: -0.3, phase: 4 },
      { x: width * 0.3, y: height * 0.8, r: 250, color: "rgba(43, 43, 238, 0.06)", vx: -0.15, vy: -0.2, phase: 1 },
      { x: width * 0.7, y: height * 0.4, r: 180, color: "rgba(80, 80, 255, 0.09)", vx: 0.35, vy: 0.25, phase: 3 },
    ];

    const particles: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
        speed: Math.random() * 0.3 + 0.1,
      });
    }

    let time = 0;

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      time += 0.005;

      for (const orb of orbs) {
        const ox = orb.x + Math.sin(time + orb.phase) * 60 * orb.vx;
        const oy = orb.y + Math.cos(time * 0.7 + orb.phase) * 50 * orb.vy;
        const scale = 1 + Math.sin(time * 0.5 + orb.phase) * 0.15;

        const gradient = ctx!.createRadialGradient(ox, oy, 0, ox, oy, orb.r * scale);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, "transparent");

        ctx!.beginPath();
        ctx!.arc(ox, oy, orb.r * scale, 0, Math.PI * 2);
        ctx!.fillStyle = gradient;
        ctx!.fill();
      }

      for (const p of particles) {
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = height + 5;
          p.x = Math.random() * width;
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(150, 150, 255, ${p.alpha})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101022] p-4">
      <AnimatedOrbs />

      {/* Gradiente radial de fondo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(43,43,238,0.08)_0%,transparent_70%)]" />

      {/* Rejilla sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">{children}</div>
    </div>
  );
}
