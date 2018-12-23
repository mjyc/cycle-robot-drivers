import {Stream} from 'xstream';
import {Result} from '@cycle-robot-drivers/action';

export interface ActionSinks {
  result: Stream<Result>,
}

export interface TwoSpeechbuttonsActionSinks extends ActionSinks {
  DOM?: Stream<any>,
}

export interface SpeechSynthesisActionSinks extends ActionSinks {
  output?: Stream<any>,
}

export interface SpeechRecogntionActionSinks extends ActionSinks {
  output?: Stream<any>,
}
