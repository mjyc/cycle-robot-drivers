import xs from "xstream";
import fromEvent from "xstream/extra/fromEvent";
import { Driver } from "@cycle/run";
import { adapt } from "@cycle/run/lib/adapt";
import { EventSource } from "@cycle-robot-drivers/action";

class UtteranceSource implements EventSource {
  constructor(private _utterance: SpeechSynthesisUtterance) {}

  events(eventName: string) {
    return adapt(fromEvent(this._utterance, eventName));
  }
}

export type UtteranceArg = {
  lang?: string;
  pitch?: number;
  rate?: number;
  text?: string;
  voice?: object;
};

/**
 * Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
 * driver factory.
 *
 * @return {Driver} the SpeechSynthesis Cycle.js driver function. It takes a
 *   stream of objects containing [`SpeechSynthesisUtterance` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Properties)
 *   and returns a `EventSource`:
 *
 *   * `EventSource.events(eventName)` returns a stream of  `eventName`
 *     events from [`SpeechSynthesisUtterance`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Event_handlers).
 */
export function makeSpeechSynthesisDriver(): Driver<any, EventSource> {
  const synthesis: SpeechSynthesis = window.speechSynthesis;
  const utterance: SpeechSynthesisUtterance = new SpeechSynthesisUtterance();

  return function(sink$) {
    let listener;
    let timeoutID;
    let afterpauseduration;

    xs.fromObservable(sink$).addListener({
      next: args => {
        // array values are SpeechSynthesisUtterance properties that are not
        //   event handlers; see
        //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
        if (!args) {
          afterpauseduration = 0;
          synthesis.cancel();
        } else {
          ["lang", "pitch", "rate", "text", "voice", "volume"].map(arg => {
            if (arg in args) {
              utterance[arg] = args[arg];
            }
          });

          // add a afterpauseduration param handler
          utterance.removeEventListener("end", listener);
          listener = evt => {
            clearTimeout(timeoutID);
            timeoutID = setTimeout(
              _ =>
                utterance.dispatchEvent(
                  new CustomEvent("delayedend", {
                    detail: { SpeechSynthesisEvent: evt, afterpauseduration }
                  })
                ),
              afterpauseduration
            );
          };
          utterance.addEventListener("end", listener);

          afterpauseduration =
            typeof args["afterpauseduration"] !== "number" ||
            args["afterpauseduration"] < 0
              ? 0
              : args["afterpauseduration"];
          synthesis.speak(utterance);
          // https://www.chromestatus.com/feature/5687444770914304
          if (!synthesis.speaking) {
            console.warn('Cannot speak utterance; dispatching "end"');
            utterance.dispatchEvent(new Event("end"));
          }
        }
      }
    });

    return new UtteranceSource(utterance) as EventSource;
  };
}
