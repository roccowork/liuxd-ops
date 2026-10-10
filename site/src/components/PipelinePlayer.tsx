import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';
import { CHAPTERS, DURATION, Delivery, FPS, H, W } from '../remotion/Delivery';

const chapterAt = (frame: number) => CHAPTERS.findIndex((c) => frame >= c.from && frame < c.from + c.dur);

export default function PipelinePlayer() {
  const player = useRef<PlayerRef>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const p = player.current;
    if (!p) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onFrame = (e: { detail: { frame: number } }) => setChapter(chapterAt(e.detail.frame));
    p.addEventListener('play', onPlay);
    p.addEventListener('pause', onPause);
    p.addEventListener('frameupdate', onFrame);

    // 减少动态效果：停在结尾画面，由用户自己点播放
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      p.seekTo(CHAPTERS[3].from + 160);
      return;
    }
    // 滚到可见区域才播放，离开就暂停
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? p.play() : p.pause()), { threshold: 0.4 });
    if (box.current) io.observe(box.current);
    return () => {
      io.disconnect();
      p.removeEventListener('play', onPlay);
      p.removeEventListener('pause', onPause);
      p.removeEventListener('frameupdate', onFrame);
    };
  }, []);

  const jump = (i: number) => {
    player.current?.seekTo(CHAPTERS[i].from);
    player.current?.play();
  };

  return (
    <div ref={box} className="pp">
      <div className="pp-screen">
        <Player
          ref={player}
          component={Delivery}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={W}
          compositionHeight={H}
          style={{ width: '100%' }}
          loop
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          numberOfSharedAudioTags={0}
          acknowledgeRemotionLicense
        />
      </div>
      <div className="pp-bar">
        <button
          type="button"
          className="pp-play"
          onClick={() => (playing ? player.current?.pause() : player.current?.play())}
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z" fill="currentColor" /></svg>
          )}
        </button>
        <ol className="pp-chapters">
          {CHAPTERS.map((c, i) => (
            <li key={c.label}>
              <button type="button" className={i === chapter ? 'on' : ''} onClick={() => jump(i)}>
                <span className="mono">0{i + 1}</span>{c.label}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
