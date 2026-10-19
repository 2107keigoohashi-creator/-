import {loadFont} from '@remotion/fonts';
import React from 'react';
import {Composition, staticFile} from 'remotion';
import {FONT_FAMILY, FPS, HEIGHT, WIDTH} from './config';
import {EpisodeVideo} from './Episode';
import {calculateEpisodeMetadata, episodeIds} from './load';

loadFont({family: FONT_FAMILY, url: staticFile('fonts/NotoSansJP.ttf'), weight: '100 900'});

// episodes/ep*.json ごとにコンポジションを1つ作る（ID = ファイル名）
export const Root: React.FC = () => (
  <>
    {episodeIds.map((id) => (
      <Composition
        key={id}
        id={id}
        component={EpisodeVideo}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={1}
        defaultProps={{episodeId: id}}
        calculateMetadata={calculateEpisodeMetadata}
      />
    ))}
  </>
);
