import xs from "xstream";
import fromEvent from "xstream/extra/fromEvent";
import { Driver } from "@cycle/run";
import { adapt } from "@cycle/run/lib/adapt";
import { EventSource } from "@cycle-robot-drivers/action";

class RecognitionSource implements EventSource {
  constructor(private _recognition: SpeechRecognition) {}

  events(eventName: string) {
    return adapt(
      !!this._recognition ? fromEvent(this._recognition, eventName) : xs.never()
    );
  }
}

export type SpeechRecognitionArg = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  serviceURI?: string;
};

/**
 * Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
 * driver factory.
 *
 * @return {Driver} the SpeechRecognition Cycle.js driver function. It takes a
 *   stream of objects containing [`SpeechRecognition` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Properties)
 *   and returns a `EventSource`:
 *
 *   * `EventSource.events(eventName)` returns a stream of `eventName`
 *     events from [`SpeechRecognition`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Event_handlers).
 */
export function makeSpeechRecognitionDriver(): Driver<any, EventSource> {
  const { webkitSpeechRecognition } = window as any;
  let recognition: SpeechRecognition;
  try {
    recognition = new webkitSpeechRecognition();
  } catch (err) {
    console.warn(err);
    recognition = new EventTarget() as SpeechRecognition;
  }

  return function(sink$) {
    xs.fromObservable(sink$).addListener({
      next: args => {
        if (typeof recognition.start === "undefined") {
          console.warn(
            'SpeechRecognition interface is not available; displatching "end" event'
          );
          recognition.dispatchEvent(new Event("end"));
          return;
        }
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
        if (!args) {
          recognition.abort();
        } else {
          [
            "lang",
            "continuous",
            "interimResults",
            "maxAlternatives",
            "serviceURI"
          ].map(arg => {
            if (arg in args) {
              recognition[arg] = args[arg];
            }
          });
          recognition.start();
        }
      }
    });

    return new RecognitionSource(recognition) as EventSource;
  };
}
