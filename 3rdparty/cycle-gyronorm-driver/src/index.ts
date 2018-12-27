import xs from 'xstream';
import GyroNorm from 'gyronorm/dist/gyronorm.complete';
import {adapt} from '@cycle/run/lib/adapt';

/**
 * [gyronorm.js](https://github.com/dorukeker/gyronorm.js) accelerometer and gyroscope driver factory.
 *
 * @param options a subset of the GyroNorm options (https://github.com/dorukeker/gyronorm.js#options)
 *
 *   * frequency? {number}
 *   * gravityNormalized? {boolean}
 *   * orientationBase? {string}
 *   * decimalCount? {number}
 *   * screenAdjusted? {boolean}
 *
 * @return {Driver} the GyroNorm Cycle.js driver function. It takes no stream
 *   and returns [GyroNorm output data](https://github.com/dorukeker/gyronorm.js#how-to-use).
 *
 */
export function makeGyronormDriver(options: {
  frequency?: number,
	gravityNormalized?: boolean,
	orientationBase?: string,
	decimalCount?: number,
	screenAdjusted?: boolean,
} = {}) {
  const gn = new GyroNorm(options);

  function gyronormDriver() {
    const source$ = xs.create({
      start: listener => {
        gn.init()
          .then(() => {
            gn.start((data) => {
              listener.next(data);
            });
          })
          .catch((e) => {
            console.error('Failed to initialize GyroNorm:', e);
            listener.error(e);
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
