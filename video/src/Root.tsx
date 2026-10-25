import { Composition } from 'remotion';
import { Showreel, DURATION, FPS, W, H } from './Showreel';
import { StyleGitops, StylePlatform } from './styleframes';

export const Root = () => (
  <>
    <Composition id="Showreel" component={Showreel} durationInFrames={DURATION} fps={FPS} width={W} height={H} />
    <Composition id="StylePlatform" component={StylePlatform} durationInFrames={300} fps={30} width={1920} height={1080} />
    <Composition id="StyleGitops" component={StyleGitops} durationInFrames={300} fps={30} width={1920} height={1080} />
  </>
);
