import {Stream} from 'xstream';
import {Result} from '@cycle-robot-drivers/action';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type ReducerStateTemplate<S, V, O> = {
  state: S
  variables: V,
  outputs: O,
};

export interface ActionSinks {
  output?: any,
  DOM?: any,
  result: Stream<Result>,
}

// export interface FacialExpressionActionSinks extends ActionSinks {
//   result: Stream<Result>,
// }

// export interface TwoSpeechbuttonsAction extends ActionSinks {
//   result: Stream<Result>,
// }