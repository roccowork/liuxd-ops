import { Composition } from 'remotion';
import { Showreel, DURATION, FPS, W, H } from './Showreel';

export const Root = () => (
  <Composition id="Showreel" component={Showreel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
);
