'use client';

import { useEffect, useRef } from 'react';

export default function GapHeatmap({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const cellWidth = width / data.length;
    const maxCount = Math.max(...data.map(d => d.count || 0), 1);
    
    data.forEach((item, i) => {
      const intensity = (item.count || 0) / maxCount;
      const red = 255;
      const green = Math.floor(200 - (intensity * 180));
      const blue = Math.floor(150 - (intensity * 100));
      
      ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      ctx.fillRect(i * cellWidth, 0, cellWidth - 1, height);
      
      ctx.fillStyle = '#1a1a2e';
      ctx.font = '10px Inter';
      ctx.save();
      ctx.translate(i * cellWidth + cellWidth / 2, height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.fillText(item.concept || '', 5, 0);
      ctx.restore();
    });
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={200}
      className="w-full h-auto"
      style={{ maxWidth: '100%' }}
    />
  );
}