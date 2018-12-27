import xs from 'xstream';
import GyroNorm from 'gyronorm';
console.log(GyroNorm);

import {adapt} from '@cycle/run/lib/adapt';

export function makeGyronormDriver() {
  return function() {
    const source$ = xs.periodic(100);
    return adapt(source$);
  }
}
