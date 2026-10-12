// 虚构示意：复制到某期 visual/scenes/index.jsx 后，用 scene.type=custom、data.key=RouteChoice 引用。
// 此文件会被复制到共享 Remotion 运行目录再打包；首版请保持单文件，不使用相对 import。
import React from 'react';
import { useCurrentFrame } from 'remotion';

function RouteChoice({ shot, durationFrames }) {
  const frame = useCurrentFrame();
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationFrames - 1)));
  const data = shot.scene.data;
  return <svg width="100%" height="100%" viewBox="0 0 1280 720">
    <rect width="1280" height="720" fill="#e7e1d4" />
    <text x="80" y="120" fontSize="48" fill="#27343a">{data.title ?? '路线改变'}</text>
    <path d="M160 420H550" stroke="#a04f43" strokeWidth="18" strokeDasharray="20 12" />
    <text x="160" y="380" fontSize="35" fill="#27343a">{data.before ?? '原路线'}</text>
    <path d={`M550 420L${550 + 530 * progress} ${420 - 140 * progress}`} stroke="#397c87" strokeWidth="18" fill="none" />
    <circle cx={550 + 530 * progress} cy={420 - 140 * progress} r="24" fill="#397c87" />
    <text x="900" y="245" fontSize="35" fill="#27343a">{data.after ?? '新路线'}</text>
    <text x="1180" y="650" textAnchor="end" fontSize="24" fill="#80635b">虚构示意</text>
  </svg>;
}

export default { RouteChoice };
