// import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction'
import isolate from '@cycle/isolate';

describe('hello', () => {
  test('world', () => {
    console.log(isolate);
    expect(true).toBe(true);
  });
});
