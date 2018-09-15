import {Stream} from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {adapt} from '@cycle/run/lib/adapt';
import {EventSource} from '@cycle-robot-drivers/action';


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
    sink$.addListener({
      next: (props) => {
        if (!props) {
          audio.pause();
        } else {
          // array values are a subset of HTMLAudioElement properties; see
          //   https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
          ['src', 'volume', 'loop'].map(prop => {
            if (prop in props) {
              audio[prop] = props[prop];
            }
          });
          audio.play();
        }
      }
    });

    return new AudioSource(audio) as EventSource;
  }
}
