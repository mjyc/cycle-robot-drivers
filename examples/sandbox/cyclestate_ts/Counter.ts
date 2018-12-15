import xs, {Stream} from 'xstream';
import {div, button, p, makeDOMDriver, VNode, DOMSource} from '@cycle/dom';
import {StateSource, Reducer} from '@cycle/state';

export type State = {
  count: number;
};

export type Sources = {
  DOM: DOMSource;
  state: StateSource<State>;
};

export type Sinks = {
  DOM: Stream<VNode>;
  state: Stream<Reducer<State>>;
};

export default function Counter(sources: Sources): Sinks {
  const action$ = xs.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -1),
    sources.DOM.select('.increment').events('click').map(ev => +1)
  );

  const state$ = sources.state.stream;

  const vdom$ = state$.map(state =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('Counter: ' + state.count)
    ])
  );

  const initReducer$ = xs.of(function initReducer(prevState: State): State {
    if (prevState) {
      return prevState;
    } else {
      return {count: 0};
    }
  });
  const updateReducer$ = action$
    .map(num => function updateReducer(prevState: State): State {
      return {count: prevState.count + num};
    });
  const reducer$ = xs.merge(initReducer$, updateReducer$);

  return {
    DOM: vdom$,
    state: reducer$,
  };
}
