import {Stream} from 'xstream';
import {Result} from '@cycle-robot-drivers/action';

// Action types
export interface ActionSinks {
  result: Stream<Result>,
}

export interface FacialExpressionActionSinks extends ActionSinks {
  output?: Stream<any>,
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

// Reducer types
export type FSMReducerState<S, V, O> = {
  state: S
  variables: V,
  outputs: O,
};