import xs from 'xstream';
// import '@hughsk/fulltilt/dist/fulltilt';
// console.log((window as any).FULLTILT);
// (window as any).FULLTILT.getDeviceOrientation({'type': 'game'});
// (window as any).FULLTILT.getDeviceMotion();
// import GyroNorm from 'gyronorm';
declare var require: any
var GyroNorm = require('gyronorm/dist/gyronorm.complete');
// console.log(GyroNorm);

// import * as GyroNorm from './gyronorm.complete';
// const GyroNorm = require('./gyronorm.complete');
// console.log(GyroNorm);

import {adapt} from '@cycle/run/lib/adapt';

export function makeGyronormDriver() {
  const gn = new GyroNorm();

  function gyronormDriver() {
    // const source$ = xs.periodic(1000);
    const source$ = xs.create({
      start: listener => {
        gn.init().then(() => {
          gn.start((data) => {
            listener.next(data);
          });
        });
      },
      stop: () => {
        gn.stop();
      }
    });
    return adapt(source$);
  }

  return gyronormDriver;
}
