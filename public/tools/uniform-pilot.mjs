// Shared explicit-mask decoder and material shading. Source pixels remain immutable.
export const EDITABLE_PARTS = [1, 2, 3, 4];
export function decodeMask(mask, sourceHash, width, height) {
  if (mask.version !== 1 || mask.sha256 !== sourceHash || mask.width !== width || mask.height !== height) throw Error('Mask does not match the original sprite sheet.');
  const labels = new Uint8Array(width * height);
  for (const [start, length, id] of mask.runs) {
    if (![start, length, id].every(Number.isInteger) || start < 0 || length < 1 || start + length > labels.length || id < 1 || id > 10) throw Error('Invalid mask range.');
    for (let i = start; i < start + length; i++) {
      if (labels[i]) throw Error('Overlapping mask ranges.');
      labels[i] = id;
    }
  }
  return labels;
}
export function recolorPixels(source, labels, palette) {
  if (source.length !== labels.length * 4) throw Error('Pixel and mask sizes differ.');
  const out = new Uint8ClampedArray(source);
  for (let i = 0; i < labels.length; i++) {
    const color = palette[labels[i]];
    if (!EDITABLE_PARTS.includes(labels[i]) || !color || !source[i * 4 + 3]) continue;
    const [r,g,b] = source.subarray(i*4,i*4+3);
    // This is shading only. Material selection comes exclusively from the mask.
    const blue = b > r * 1.22 && b > g * 1.08;
    const reference = blue ? (labels[i] === 1 ? 100 : 184) : 252;
    const shade = Math.max(0.30, Math.min(1.15, Math.max(r,g,b) / reference));
    for (let k=0;k<3;k++) out[i*4+k]=Math.min(255,Math.round(color[k]*shade));
  }
  return out;
}
