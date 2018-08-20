// Implements the travel quiz presented at
//   http://www.nomadwallet.com/afford-travel-quiz-personality/
import Snabbdom from 'snabbdom-pragma';
import dagreD3 from 'dagre-d3'
import * as d3 from 'd3';
import xs from 'xstream';
import {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {makeDOMDriver} from '@cycle/dom';
import {Goal, Result, initGoal} from '@cycle-robot-drivers/action'
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen'

// Define enums
enum SMStates {
  ASK_CAREER_QUESTION = 'It\'s import that I reach my full career potential',
  ASK_WORKING_ONLINE_QUESTION = 'I can see myself working online',
  ASK_FAMILY_QUESTION = 'I have to be near my family/friends/pets',
  ASK_SHORT_TRIPS_QUESTION = 'Short trips are awesome!',
  ASK_HOME_OWNERSHIP_QUESTION = 'I want to have a home and nice things',
  ASK_ROUTINE_QUESTION = 'A routine gives my life structure',
  ASK_JOB_SECURITY_QUESTION = 'I need a secure job and a stable income',
  TELL_THEM_THEY_ARE_VACATIONER = 'You are a vacationer!',
  TELL_THEM_THEY_ARE_EXPAT = 'You are an expat!',
  TELL_THEM_THEY_ARE_NOMAD = 'You are a nomad!',
};

enum SMActions {
  RECEIVED_YES = 'Yes',
  RECEIVED_NO = 'No',
  RECEIVED_RESTART = 'Restart',
};

// define types
type State = {
  question: SMStates,
  graph: any,
};

type Reducer = (prev?: State) => State | undefined;

type Actions = Stream<Result>;

// define consts
const machine = {
  [SMStates.ASK_CAREER_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.ASK_WORKING_ONLINE_QUESTION,
    [SMActions.RECEIVED_NO]: SMStates.ASK_FAMILY_QUESTION,
  },
  [SMStates.ASK_WORKING_ONLINE_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.TELL_THEM_THEY_ARE_NOMAD,
    [SMActions.RECEIVED_NO]: SMStates.TELL_THEM_THEY_ARE_VACATIONER,
  },
  [SMStates.ASK_FAMILY_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.TELL_THEM_THEY_ARE_VACATIONER,
    [SMActions.RECEIVED_NO]: SMStates.ASK_SHORT_TRIPS_QUESTION,
  },
  [SMStates.ASK_SHORT_TRIPS_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.TELL_THEM_THEY_ARE_VACATIONER,
    [SMActions.RECEIVED_NO]: SMStates.ASK_HOME_OWNERSHIP_QUESTION,
  },
  [SMStates.ASK_HOME_OWNERSHIP_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.TELL_THEM_THEY_ARE_EXPAT,
    [SMActions.RECEIVED_NO]: SMStates.ASK_ROUTINE_QUESTION,
  },
  [SMStates.ASK_ROUTINE_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.TELL_THEM_THEY_ARE_EXPAT,
    [SMActions.RECEIVED_NO]: SMStates.ASK_JOB_SECURITY_QUESTION,
  },
  [SMStates.ASK_JOB_SECURITY_QUESTION]: {
    [SMActions.RECEIVED_YES]: SMStates.ASK_WORKING_ONLINE_QUESTION,
    [SMActions.RECEIVED_NO]: SMStates.TELL_THEM_THEY_ARE_NOMAD,
  },
  [SMStates.TELL_THEM_THEY_ARE_NOMAD]: {
    [SMActions.RECEIVED_RESTART]: SMStates.ASK_CAREER_QUESTION,
  },
  [SMStates.TELL_THEM_THEY_ARE_VACATIONER]: {
    [SMActions.RECEIVED_RESTART]: SMStates.ASK_CAREER_QUESTION,
  },
  [SMStates.TELL_THEM_THEY_ARE_EXPAT]: {
    [SMActions.RECEIVED_RESTART]: SMStates.ASK_CAREER_QUESTION,
  },
};

// define functions
function makeDagreD3Driver({
  width,
  height,
}: {
  width?: number,
  height?: number,
} = {}) {
  const render = new dagreD3.render();

  return function dagreD3Driver(sink$) {
    sink$.filter(g => !g).addListener({
      next: g => console.error(`Invalid input: ${JSON.stringify(g, null, 2)}`)
    })
    sink$.filter(g => !!g).fold((acc, g) => ({
      g,
      i: acc.i + 1,
    }), {g: null, i: -1}).drop(1).addListener({
      next: ({g, i}) => {
        const svg = d3.select('svg');
        const inner = svg.select('g');
        render(inner, g);
        if (i === 0) {
          // setup width & height
          width && svg.attr('width', width);
          height && svg.attr('height', height);
          // set up zoom support
          const zoom = d3.zoom().on('zoom', function() {
            svg.select('g').attr('transform', d3.event.transform);
          });
          svg.call(zoom);
          // center the graph
          const initialScale = 0.8;
          svg.call(
            zoom.transform,
            d3.zoomIdentity
              .translate(
                (svg.attr("width") - g.graph().width * initialScale) / 2, 20
              )
              .scale(initialScale)
          );
        }
      },
      error: err => console.error(err),
    });

    return adapt(xs.of((
      <svg><g/></svg>
    )));
  };
}

function createGraph(states: string[], actions: string[], machine) {
  const g = new dagreD3.graphlib.Graph().setGraph({});
  states.map(state => g.setNode(state, {
    label: state,
    style: 'stroke: #333; fill: #fff;',
  }));
  Object.keys(machine).map(state => {
    Object.keys(machine[state]).map(action => {
      const nextState = machine[state][action];
      g.setEdge(state, nextState, {
        label: action,
        style: 'stroke: #333; fill: none; stroke-width: 1.5px;',
      });
    })
  });
  return g;
}

function transition(state: SMStates, action: SMActions) {
  const actions = machine[state];
  if (!actions) {
    console.debug(`Invalid state: "${state}"; returning null`);
    return null;
  }
  const newState = actions[action];
  if (!newState) {
    console.debug(`Invalid action: "${action}"; returning null`);
    return null;
  }
  return newState;
}

function model(result$: Actions): Stream<State> {
  const initReducer$ = fromEvent(window, 'load').mapTo(function initReducer(prev) {
    const question = SMStates.ASK_CAREER_QUESTION;
    const graph = createGraph(
      Object.keys(SMStates).map(k => SMStates[k]),
      Object.keys(SMActions).map(k => SMActions[k]),
      machine,
    );
    graph.node(question).style = 'fill: #f77';
    return {question, graph};
  });

  const resultReducer$ = result$
    .filter(result => result.status.status === 'SUCCEEDED')
    .map(result => function resultReducer(prevState: State): State {
      // make a transition
      const question = transition(
        prevState.question,
        result.result,
      );
      // update the graph
      if (!!question) {
        prevState.graph.setNode(prevState.question, {
          label: prevState.question,
          style: 'stroke: #333; fill: #fff;',
        });
        prevState.graph.setNode(question, {
          label: question,
          style: 'stroke: #333; fill: #f77',
        });
      }
      return !!question ? {
        question,
        graph: prevState.graph
      } : prevState;
    });

  return xs.merge(initReducer$, resultReducer$)
    .fold((state: State, reducer: Reducer) => reducer(state), null)
    .drop(1)  // drop "null"
    .compose(dropRepeats());
}

function goal(state: Stream<State>): Stream<Goal> {
  return xs.merge(
    state.map(s => {
      return (
        s.question === SMStates.TELL_THEM_THEY_ARE_NOMAD
        || s.question === SMStates.TELL_THEM_THEY_ARE_VACATIONER
        || s.question === SMStates.TELL_THEM_THEY_ARE_EXPAT
      ) ? initGoal({type: 'ASK_QUESTION', value: [
          s.question,
          [SMActions.RECEIVED_RESTART],
        ]}) : initGoal({type: 'ASK_QUESTION', value: [
          s.question,
          [SMActions.RECEIVED_YES, SMActions.RECEIVED_NO],
        ]});
    })
  );
}

function main(sources) {
  const goalProxy$ = xs.create();
  const speechbubbleAction = TwoSpeechbubblesAction({
    goal: goalProxy$,
    DOM: sources.DOM,
  });

  const state$ = model(speechbubbleAction.result);
  const goal$ = goal(state$);

  // send goals
  goalProxy$.imitate(goal$);

  // update graph
  const graph$ = state$.map(s2 => s2.graph);

  // update visualizer
  const vdom$ = xs.combine(
    sources.DagreD3,
    speechbubbleAction.DOM,
  ).map(([b, g]) => (
    <div>
      <div>
        {g}
      </div>

      <div>
        {b}
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    DagreD3: graph$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  DagreD3: makeDagreD3Driver({width: 960, height: 720}),
});
