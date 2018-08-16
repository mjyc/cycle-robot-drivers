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
} from '@cycle-robot-drivers/face'

// Define enums
enum SMStates {
  ASK_CAREER_QUESTION = 'ASK_CAREER_QUESTION',
  ASK_WORKING_ONLINE_QUESTION = 'ASK_WORKING_ONLINE_QUESTION',
  ASK_FAMILY_QUESTION = 'ASK_FAMILY_QUESTION',
  ASK_SHORT_TRIPS_QUESTION = 'ASK_SHORT_TRIPS_QUESTION',
  ASK_HOME_OWNERSHIP_QUESTION = 'ASK_HOME_OWNERSHIP_QUESTION',
  ASK_ROUTINE_QUESTION = 'ASK_ROUTINE_QUESTION',
  ASK_JOB_SECURITY_QUESTION = 'ASK_JOB_SECURITY_QUESTION',
  TELL_THEM_THEY_ARE_VACATIONER = 'TELL_THEM_THEY_ARE_VACATIONER',
  TELL_THEM_THEY_ARE_EXPAT = 'TELL_THEM_THEY_ARE_EXPAT',
  TELL_THEM_THEY_ARE_NOMAD = 'TELL_THEM_THEY_ARE_NOMAD',
};

enum SMActions {
  RECEIVED_YES = 'YES',
  RECEIVED_NO = 'NO',
};

// define types
type State = {
  question: SMStates,
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
};
console.error('========', machine)

// define functions
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
    return {
      question: SMStates.ASK_CAREER_QUESTION,
    };
  });

  const resultReducer$ = result$
    .filter(result => result.status.status === 'SUCCEEDED')
    .map(result => function resultReducer(prevState: State): State {
      // extract yes & no
      const question = transition(
        prevState.question,
        result.result,
      );
      return !!question ? {question} : prevState;
    });

  return xs.merge(initReducer$, resultReducer$)
    .fold((state: State, reducer: Reducer) => reducer(state), null)
    .drop(1)  // drop "null"
    .compose(dropRepeats());
}

function goal(state: Stream<State>): Stream<Goal> {
  return state
    .map(s => initGoal({type: 'ASK_QUESTION', value: [s.question, ['YES', 'NO']]}));
}


//------------------------------------------------------------------------------
const types = ['SET_MESSAGE', 'ASK_QUESTION'];  // TODO: remove soon


//------------------------------------------------------------------------------
function makeDagreD3Driver() {
  const render2 = new dagreD3.render();

  return function dagreD3Driver(sink$) {
    sink$.addListener({
      next: (g) => {
        if (!g) {
          console.warn('Invalid input:', g);
          return;
        }
        const svg = d3.select('svg').select('g');
        d3.select('svg').attr('height', 1000);
        d3.select('svg').attr('width', 800);
        render2(svg, g);
      }
    });

    return adapt(xs.of((<svg><g/></svg>)));
  };
}

function createG() {
  // Create a new directed graph
  var g = new dagreD3.graphlib.Graph().setGraph({});

  // States and transitions from RFC 793
  var states = [ 'LOAD', 'READ', 'WAIT', 'RESUME', 'DONE' ];

  // Automatically label each of the nodes
  states.forEach(function(state) { g.setNode(state, { label: state }); });

  // Set up the edges
  g.setEdge("LOAD", "READ", {label: "FOUND_PERSON"});
  g.setEdge("READ", "WAIT", {label: "LOST_PERSON"});
  g.setEdge("READ", "READ", {label: "FINISHED_SPEACKING"});
  g.setEdge("READ", "DONE", {label: "FINISHED_READING"});
  g.setEdge("WAIT", "RESUME", {label: "FOUND_PERSON"});
  g.setEdge("RESUME", "READ", {label: "FINISHED_SPEACKING"});

  // // Set some general styles
  // g.nodes().forEach(function(v) {
  //   var node = g.node(v);
  //   node.rx = node.ry = 5;
  // });

  // // Add some custom colors based on state
  // g.node('CLOSED').style = "fill: #f77";
  // g.node('ESTAB').style = "fill: #7f7";
  g.node('LOAD').style = "fill: #f77";

  return g;
}

enum SMStates2 {
  LOAD = 'LOAD',
  READ = 'READ',
  WAIT = 'WAIT',
  RESUME = 'RESUME',
  DONE = 'DONE',
};
const keys = Object.keys(SMStates2).map(s => console.error(s));


function createG2() {
  // Create a new directed graph
  var g = new dagreD3.graphlib.Graph().setGraph({});

  // States and transitions from RFC 793
  var states = [ 'LOAD', 'READ', 'WAIT', 'RESUME', 'DONE' ];

  // Automatically label each of the nodes
  states.forEach(function(state) { g.setNode(state, { label: state }); });

  // Set up the edges
  g.setEdge("LOAD", "READ", {label: "FOUND_PERSON"});
  g.setEdge("READ", "WAIT", {label: "LOST_PERSON"});
  g.setEdge("READ", "READ", {label: "FINISHED_SPEACKING"});
  g.setEdge("READ", "DONE", {label: "FINISHED_READING"});
  g.setEdge("WAIT", "RESUME", {label: "FOUND_PERSON"});
  g.setEdge("RESUME", "READ", {label: "FINISHED_SPEACKING"});

  // // Set some general styles
  // g.nodes().forEach(function(v) {
  //   var node = g.node(v);
  //   node.rx = node.ry = 5;
  // });

  // // Add some custom colors based on state
  g.node('LOAD').style = null;

  return g;
}


//------------------------------------------------------------------------------
function main(sources) {
  const goalProxy$ = xs.create();
  const speechbubbleAction = TwoSpeechbubblesAction({
    goal: goalProxy$,
    DOM: sources.DOM,
  });



  const state2$ = model(speechbubbleAction.result);
  state2$.addListener({next: d => console.log('state2$', d)});

  const goal2$ = goal(state2$);
  goal2$.addListener({next: d => console.log('goal2$', d)});



  const params$ = xs.combine(
    sources.DOM.select('#type').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(types[0]),
    sources.DOM.select('#value').events('focusout')
      .map(ev => {
        const value = (ev.target as HTMLInputElement).value;
        try { return JSON.parse(value); } catch { return value; }
      })
      .startWith(''),
  ).map(([type, value]) => ({type, value})).remember();

  // send goals to the action
  goalProxy$.imitate(
    goal2$
    // xs.merge(
    //   sources.DOM.select('#start').events('click')
    //     .mapTo(params$.take(1)).flatten(),
    //   sources.DOM.select('#cancel').events('click').mapTo(null),
    // )
  );

  // update the state
  const state$ = xs.combine(
    params$,
    speechbubbleAction.status.startWith(null),
    speechbubbleAction.result.startWith(null),
  ).map(([params, status, result]) => {
    return {
      ...params,
      status,
      result,
    }
  });

  // update graph
  const graph$ = fromEvent(window, 'load').mapTo(createG());
  setTimeout(() => {
    graph$.shamefullySendNext(createG2());
  }, 2000);

  // update visualizer
  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(
      state$,
      speechbubbleAction.DOM,
      sources.DagreD3,
  ).map(([s, b, g]) => (
    <div>
      <h1>TwoSpeechbubblesAction component demo</h1>

      <div>
        {b}
      </div>

      <div>
        <h3>Action inputs</h3>
        <div>
          <select id="type">{types.map(type => (type === s.type ? (
            <option selected value={type}>{type}</option>
          ) : (
            <option value={type}>{type}</option>
          )))}</select>
          <input id="value"></input>
          <div><small>Try <code style={styles.code}>
          ["Do you want cookie or ice cream?", ["Cookie", "Ice cream", "Both"]]
          </code> for ASK_CHOICE</small></div>
        </div>
      </div>

      <div>
        <h3>Controls</h3>
        <div>
          <button id="start">Start</button>
          <button id="cancel">Cancel</button>
        </div>
      </div>

      <div>
        <h3>Action outputs</h3>
        <div>
          <pre style={styles.code}>"status": {JSON.stringify(s.status, null, 2)}
          </pre>
          <pre style={styles.code}>"result": {JSON.stringify(s.result, null, 2)}
          </pre>
        </div>
      </div>

      <div>
        {g}
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
  DagreD3: makeDagreD3Driver(),
});
