import './spriteStudio.js';

function opaquePixels(canvas) {
  if (!canvas) return 0;
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
  return count;
}

async function repairInitialPoseState() {
  for (let attempt = 0; attempt < 120; attempt++) {
    const api = window.__gridironSpriteStudio;
    if (api?.state?.master && api.state.poses?.size) {
      const { state } = api;
      const masterCount = opaquePixels(state.master);
      if (masterCount > 100) {
        for (const pose of state.poses.values()) {
          if (opaquePixels(pose) > 100) continue;
          const ctx = pose.getContext('2d');
          ctx.clearRect(0, 0, pose.width, pose.height);
          ctx.drawImage(state.master, 0, 0);
        }
        state.current = null;
        api.loadPose('idle');
        console.info('[Gridiron Sprite Studio] Approved QB master seeded into all initial pose slots');
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  console.warn('[Gridiron Sprite Studio] Initialization repair timed out');
}

repairInitialPoseState();
