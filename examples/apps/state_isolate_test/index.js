import xs from 'xstream';
import run from '@cycle/run';
import isolate from '@cycle/isolate';
import {div, button, p, makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';

function NewCounter(sources) {
  const action$ = xs.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -2),
    sources.DOM.select('.increment').events('click').map(ev => +2)
  );

  const state$ = sources.state.stream;

  const vdom$ = state$.map(state =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('NCounter: ' + state.ncount)
    ])
  );

  const initReducer$ = xs.of(function initReducer(prevState) {
    if (prevState) {
      return prevState;
    } else {
      return {ncount: 0};
    }
  });
  const updateReducer$ = action$
    .map(num => function updateReducer(prevState) {
      return {ncount: prevState.ncount + num};
    });
  const reducer$ = xs.merge(initReducer$, updateReducer$);

  return {
    DOM: vdom$,
    state: reducer$,
  };
}

function Counter(sources) {


  const sinks2 = isolate(NewCounter, {state: 'newcounter'})(sources);


  const action$ = xs.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -1),
    sources.DOM.select('.increment').events('click').map(ev => +1)
  );

  const state$ = sources.state.stream;

  const vdom$ = state$.map((state) =>
    div([
      div([
        button('.decrement', 'Decrement'),
        button('.increment', 'Increment'),
        p('Counter: ' + state.count)
      ]),
    ]),
  );
  const vdom2$ = xs.combine(vdom$, sinks2.DOM).map(([v1, v2]) => div([v1, v2]));
  // const vdom$ = xs.combine(state$, sinks2.vdom$).map(([state, vdom]) =>
  //   div([
  //     div([
  //       button('.decrement', 'Decrement'),
  //       button('.increment', 'Increment'),
  //       p('Counter: ' + !!state && state.count)
  //     ]),
  //     vdom,
  //   ]),
  // );

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
  const reducer$ = xs.merge(initReducer$, updateReducer$, sinks2.state);

  return {
    // DOM: vdom$,
    DOM: vdom2$,
    state: reducer$,
  };
}

function main(sources) {
  const state$ = sources.state.stream;
  state$.addListener({next: v => console.log(v)})

  const sinks = isolate(Counter, {state: 'counter'})(sources);

  return sinks;
}

const wrappedMain = withState(main);

run(wrappedMain, {
  DOM: makeDOMDriver('#app')
});
