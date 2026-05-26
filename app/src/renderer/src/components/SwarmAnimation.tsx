import { useEffect, useRef } from "react";

/**
 * Animated agent swarm visualization — nodes pulse and connect with lines.
 * Used in WelcomeScreen hero section.
 */
export function SwarmAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = 300;
    const h = 200;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      color: string;
      pulse: number;
    }

    const colors = ["#8b5cf6", "#3b82f6", "#22c55e", "#eab308", "#06b6d4", "#a78bfa"];
    const nodes: Node[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 4 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
    }));

    let animId: number;
    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / 120)})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        node.pulse += 0.03;
        const pulseR = node.r + Math.sin(node.pulse) * 1.5;

        // Glow
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, pulseR + 4, 0, Math.PI * 2);
        ctx!.fillStyle = node.color + "15";
        ctx!.fill();

        // Node
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx!.fillStyle = node.color;
        ctx!.fill();

        // Move
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;
      }

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} style={{ opacity: 0.6 }} />;
}
