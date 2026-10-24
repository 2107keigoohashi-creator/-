import {Cabin} from './Cabin';
import {CabinAisle} from './CabinAisle';
import {Cockpit} from './Cockpit';
import {Background} from './common';
import {EvacSlide, FireHandle, SeatGap, SkyPlane, WeatherRadar} from './Emergency';
import {JapanMap} from './JapanMap';
import {Black, CockpitDoor, NightRadio, Plain, YokeCloseup} from './Misc';
import {Runway} from './Runway';

// 台本の "background" に書ける名前
export const BACKGROUNDS: Record<string, Background> = {
  cabin: Cabin,
  cabinAisle: CabinAisle,
  cockpit: Cockpit,
  cockpitDoor: CockpitDoor,
  yokeCloseup: YokeCloseup,
  nightRadio: NightRadio,
  japanMap: JapanMap,
  runway: Runway,
  fireHandle: FireHandle,
  skyPlane: SkyPlane,
  evacSlide: EvacSlide,
  seatGap: SeatGap,
  weatherRadar: WeatherRadar,
  plain: Plain,
  black: Black,
};
