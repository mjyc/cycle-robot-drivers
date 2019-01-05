import {makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';
import {run} from '@cycle/run';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';
import Robot from './Robot';

const main = withState(Robot);

run(main, {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});