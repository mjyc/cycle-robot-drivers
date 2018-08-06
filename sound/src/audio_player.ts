import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'


export function makeAudioPlayerDriver() {
  const audio = new Audio();

  return function audioPlayerDriver(sink$) {
    // keys are a subset of events of HTMLAudioElement; see
    //   https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
    let events = {
      'abort': null,
      'error': null,
      'ended': null,
      'loadeddata': null,
    };
    Object.keys(events).map(type => {      let eventListener = null;
      events[type] = xs.create({
        start: listener => {
          eventListener = (event) => {
            listener.next(event);
          };

        },
        stop: () => {
          if (eventListener) {
            audio.removeEventListener(type, eventListener);
            eventListener = null;
          }
        },
      });
    });

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

    Object.keys(events).map(type => {
      events[type] = adapt(events[type]);
    });
    return events;
  }
}
