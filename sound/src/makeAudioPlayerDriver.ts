import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {adapt} from '@cycle/run/lib/adapt';
import {EventSource} from '@cycle-robot-drivers/action';


/**
 * [HTML Audio](https://www.w3schools.com/tags/ref_av_dom.asp)
 * driver factory.
 *
 * @return {Driver} the HTML Audio Cycle.js driver function. It takes a
 *   stream of objects containing `[src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src).org/en-US/docs/Web/API/SpeechSynthesisUtterance#Properties)`
 *   fieldand returns a `EventSource`:
 *
 *   * `EventSource.events(eventName)` returns a stream of  `eventName`
 *     events from [`HTML Audio/Video Events`](https://www.w3schools.com/tags/ref_av_dom.asp).
 */
class AudioSource implements EventSource {
  constructor(
    private _audio: HTMLAudioElement,
  ) {}

  events(eventName: string) {
    return adapt(fromEvent(this._audio, eventName));
  }
}

export function makeAudioPlayerDriver() {
  const audio = new Audio();

  return function audioPlayerDriver(sink$) {
    xs.fromObservable(sink$).addListener({
      next: (args) => {
        if (!args) {
          audio.pause();
        } else {
          // array values are a subset of HTMLAudioElement properties; see
          //   https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
          ['src', 'volume', 'loop'].map(arg => {
            if (arg in args) {
              audio[arg] = args[arg];
            }
          });
          audio.play();
        }
      }
    });

    return new AudioSource(audio) as EventSource;
  }
}
