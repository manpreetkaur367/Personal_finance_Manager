import { useEffect, useRef } from 'react';

const AmbientBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId;
    let width = 0;
    let height = 0;
    let particles = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(34, Math.round(width / 45)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 2.5 + Math.random() * 3.5,
        speed: .08 + Math.random() * .22,
        phase: Math.random() * Math.PI * 2,
        teal: Math.random() > .62,
      }));
      draw(0, false);
    };

    const draw = (time, animate = true) => {
      context.clearRect(0, 0, width, height);
      const glow = context.createRadialGradient(width * .54, height * .48, 0, width * .54, height * .48, Math.max(width, height) * .68);
      glow.addColorStop(0, 'rgba(29, 78, 216, 0.055)');
      glow.addColorStop(.55, 'rgba(11, 31, 58, 0.025)');
      glow.addColorStop(1, 'rgba(3, 13, 31, 0)');
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      particles.forEach((particle) => {
        const drift = animate ? time * particle.speed : 0;
        const x = (particle.x + drift * .18) % width;
        const y = particle.y + Math.sin(drift * .001 + particle.phase) * 16;
        const pulse = .45 + (Math.sin(drift * .0015 + particle.phase) + 1) * .18;
        context.beginPath();
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        const bubbleColor = particle.teal ? '89, 240, 193' : '94, 200, 255';
        context.fillStyle = `rgba(${bubbleColor}, ${pulse * .3})`;
        context.shadowBlur = particle.radius * 2.5;
        context.shadowColor = `rgba(${bubbleColor}, .2)`;
        context.fill();
        context.shadowBlur = 0;
        context.beginPath();
        context.arc(x - particle.radius * .28, y - particle.radius * .3, Math.max(1, particle.radius * .2), 0, Math.PI * 2);
        context.fillStyle = `rgba(237, 246, 255, ${pulse * .42})`;
        context.fill();
      });

      if (animate && !reducedMotion) frameId = window.requestAnimationFrame(draw);
    };

    resize();
    if (!reducedMotion) frameId = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="ambient-background" aria-hidden="true">
      <canvas ref={canvasRef} className="ambient-canvas" />
      <span className="ambient-bubble bubble-one" />
      <span className="ambient-bubble bubble-two" />
      <span className="ambient-bubble bubble-three" />
    </div>
  );
};

export default AmbientBackground;
