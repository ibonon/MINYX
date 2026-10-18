'use client';

import React, { useEffect, useRef } from 'react';

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle definition
    interface Star {
      x: number;
      y: number;
      z: number;
      size: number;
      speed: number;
      char?: string;
    }

    const numStars = 220;
    const runes = ['0', '1', 'ψ', 'λ', '✦', 'Ω', 'Ξ', '✧', '◈', 'Y', 'X'];
    const stars: Star[] = [];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1.5 + 0.4,
        char: Math.random() > 0.85 ? runes[Math.floor(Math.random() * runes.length)] : undefined,
      });
    }

    const render = () => {
      ctx.fillStyle = '#060713';
      ctx.fillRect(0, 0, width, height);

      // Deep cyan/blue cosmic radial glow
      const cx = width / 2;
      const cy = height / 2;
      const gradient = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.8);
      gradient.addColorStop(0, 'rgba(14, 52, 105, 0.45)');
      gradient.addColorStop(0.4, 'rgba(8, 25, 60, 0.35)');
      gradient.addColorStop(0.8, 'rgba(6, 12, 28, 0.6)');
      gradient.addColorStop(1, '#060713');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Right-side companion summoning glow
      const compX = width > 768 ? width * 0.72 : width * 0.5;
      const compY = height > 768 ? height * 0.48 : height * 0.35;
      const compGlow = ctx.createRadialGradient(compX, compY, 20, compX, compY, 320);
      compGlow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      compGlow.addColorStop(0.5, 'rgba(14, 165, 233, 0.12)');
      compGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = compGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw streaming stars & floating cyber-runes
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.z -= star.speed;

        if (star.z <= 0) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 250 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1, Math.max(0.1, (1 - star.z / width) * 1.5));

          if (star.char) {
            ctx.font = '10px "Share Tech Mono", monospace';
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.7})`;
            ctx.fillText(star.char, px, py);
          } else {
            // Speed streak line towards outer edge
            const prevK = 250 / (star.z + star.speed * 4);
            const prevPx = star.x * prevK + cx;
            const prevPy = star.y * prevK + cy;

            ctx.beginPath();
            ctx.moveTo(prevPx, prevPy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.75})`;
            ctx.lineWidth = star.size * k * 0.6;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.6, star.size * k * 0.4), 0, Math.PI * 2);
            ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.95 }}
    />
  );
}
