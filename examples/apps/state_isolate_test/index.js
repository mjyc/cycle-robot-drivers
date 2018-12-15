import xs from 'xstream';
import run from '@cycle/run';
import isolate from '@cycle/isolate';
import {div, button, p, makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';

function Counter(sources) {
  const action$ = xs.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -1),
    sources.DOM.select('.increment').events('click').map(ev => +1)
  );

  const state$ = sources.state.stream;
  state$.addListener({next: v => console.log(v)})

  const vdom$ = state$.map(state =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('Counter: ' + state.count)
    ])
  );

  const initReducer$ = xs.of(function initReducer(prevState) {
    if (prevState) {
      return prevState;
    } else {
      return {count: 0};
    }
  });
  const updateReducer$ = action$
    .map(num => function updateReducer(prevState) {
      return {count: prevState.count + num};
    });
  const reducer$ = xs.merge(initReducer$, updateReducer$);

  return {
    DOM: vdom$,
    state: reducer$,
  };
}

function main(sources) {
  const sinks = Counter(sources);

  return sinks;
}

const wrappedMain = withState(main);

run(wrappedMain, {
  DOM: makeDOMDriver('#app')
});
