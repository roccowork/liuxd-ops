import { Composition } from 'remotion';
import { Reel, DURATION, FPS, W, H } from './Reel';

export const Root = () => <Composition id="Showreel" component={Reel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />;
