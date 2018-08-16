import Snabbdom from 'snabbdom-pragma';
import dagreD3 from 'dagre-d3'
import * as d3 from 'd3';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {makeDOMDriver} from '@cycle/dom';
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/face'

const types = ['SET_MESSAGE', 'ASK_QUESTION'];

function makeDagreD3Driver() {
  const render2 = new dagreD3.render();

  return function dagreD3Driver(sink$) {
    sink$.addListener({
      next: ({svg, g}) => {
        // if (!svg || !g) {
        //   console.warn('Invalid input svg:', svg, 'g', g);
        //   return;
        // }
        const svg1 = d3.select('svg').select('g');
        // const g1 = createG();
        // const render2 = new dagreD3.render();
        d3.select('svg').attr('height', 1000);
        d3.select('svg').attr('width', 800);
        render2(svg1, g);
      }
    });

    return adapt(xs.of({}));
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

enum SMStates {
  LOAD = 'LOAD',
  READ = 'READ',
  WAIT = 'WAIT',
  RESUME = 'RESUME',
  DONE = 'DONE',
};
const keys = Object.keys(SMStates).map(s => console.error(s));


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

function main(sources) {

  // const g = createG();
  const graph$ = fromEvent(window, 'load').mapTo({
    svg: d3.select('svg').select('g'),
    g: createG(),
    // g: g,
  }); //.debug(d => console.error(d));
  setTimeout(() => {
    graph$.shamefullySendNext({svg: null, g: createG2()});
  }, 2000);


  // const graph$ = fromEvent(window, 'load');
  // const graph$ = fromEvent(window, 'load').addListener({
  //   next: () => {
  //     const g = createG();
  //     const render = new dagreD3.render();
  //     render(d3.select("svg").select("g"), g);
  //   }
  // }); //.debug(d => console.error(d));

  // setTimeout(() => {
  //   const g = createG();

  //   var svg = d3.select("svg"),
  //     inner = svg.select("g");

  //   // Set up zoom support
  //   var zoom = d3.zoom().on("zoom", function() {
  //         inner.attr("transform", d3.event.transform);
  //       });
  //   svg.call(zoom);

  //   // Create the renderer
  // var render = new dagreD3.render();

  // // Run the renderer. This is what draws the final graph.
  // render(inner, g);

  //   var initialScale = 0.75;
  //   svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

  //   svg.attr('height', g.graph().height * initialScale + 40);
  // }, 1000);

  const goalProxy$ = xs.create();
  const speechbubbleAction = TwoSpeechbubblesAction({
    goal: goalProxy$,
    DOM: sources.DOM,
  });

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
    xs.merge(
      sources.DOM.select('#start').events('click')
        .mapTo(params$.take(1)).flatten(),
      sources.DOM.select('#cancel').events('click').mapTo(null),
    )
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

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(state$, speechbubbleAction.DOM).map(([s, b]) => (
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

      <svg><g/></svg>
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
