function curva(pontos: number[][]) {
  if (pontos.length < 2) return "";
  if (pontos.length === 2) {
    return `M${pontos[0][0].toFixed(1)},${pontos[0][1].toFixed(1)} L${pontos[1][0].toFixed(1)},${pontos[1][1].toFixed(1)}`;
  }
  let caminho = `M${pontos[0][0].toFixed(1)},${pontos[0][1].toFixed(1)}`;
  for (let i = 0; i < pontos.length - 1; i += 1) {
    const p0 = pontos[i - 1] || pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    caminho += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return caminho;
}

export function Sparkline({ pontos, cor = "#c96736" }: { pontos: number[]; cor?: string }) {
  const vals = pontos.filter((valor) => Number.isFinite(valor));
  if (vals.length < 2) return null;
  const w = 100;
  const h = 28;
  const pad = 2;
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = (maxV - minV) || 1;
  const pts = vals.map((valor, indice) => [
    pad + (indice * (w - 2 * pad)) / (vals.length - 1),
    pad + (h - 2 * pad) - ((valor - minV) / range) * (h - 2 * pad),
  ]);
  const last = pts[pts.length - 1];
  if (!last) return null;
  return (
    <svg
      className="sparkWrap sjMkSpark"
      viewBox={`0 0 ${w} ${h}`}
      height={28}
      role="img"
      aria-label="Tendência recente"
      preserveAspectRatio="none"
    >
      <path d={curva(pts)} fill="none" stroke={cor} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={cor} />
    </svg>
  );
}
