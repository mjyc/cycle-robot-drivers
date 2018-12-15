import xs, {Stream} from 'xstream';
import run from '@cycle/run';
import isolate from '@cycle/isolate';
import {div, span, ul, input, button, VNode, DOMSource, makeDOMDriver} from '@cycle/dom';
import {withState, StateSource, Reducer} from '@cycle/state';
import Counter, {State as CounterState, Sinks as CounterSinks} from './Counter';


// export type State = {
//   counter?: CounterState;
// };

// export type Sources = {
//   DOM: DOMSource;
//   state: StateSource<State>;
// };

// export type Sinks = {
//   DOM: Stream<VNode>;
//   state: Stream<Reducer<State>>;
// };


export default function main(sources) {
  sources.state.stream.addListener({next: x => console.log('state', x)});

  const counterSinks: CounterSinks = isolate(Counter, {state: 'counter'})(sources);

  const initReducer$ = xs.of(function () {
    return {counter: {count: 0}}
  });

  const counterReducer$ = counterSinks.state;
  const reducer$ = xs.merge(
    initReducer$,
    counterReducer$,
  ) as Stream<Reducer<any>>;
  const vdom$ = counterSinks.DOM;

  return {
    DOM: vdom$,
    state: reducer$,
  }
}

const wrappedMain = withState(main);

run(wrappedMain, {
  DOM: makeDOMDriver('#app')
});
