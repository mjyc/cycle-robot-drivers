import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/face'

const types = ['SET_MESSAGE', 'ASK_QUESTION'];

// import {graphlib} from 'dagre-d3';
// import * as dagreD3 from 'dagre-d3'
import dagreD3 from 'dagre-d3'
// let dagreD3 = require('dagre-d3');
console.error(dagreD3);


function main(sources) {

  // Create a new directed graph
  // var g = new graphlib.Graph().setGraph({});

  // // States and transitions from RFC 793
  // var states = [ "CLOSED", "LISTEN", "SYN RCVD", "SYN SENT",
  //                "ESTAB", "FINWAIT-1", "CLOSE WAIT", "FINWAIT-2",
  //                "CLOSING", "LAST-ACK", "TIME WAIT" ];

  // // Automatically label each of the nodes
  // states.forEach(function(state) { g.setNode(state, { label: state }); });

  // // Set up the edges
  // g.setEdge("CLOSED",     "LISTEN",     { label: "open" });
  // g.setEdge("LISTEN",     "SYN RCVD",   { label: "rcv SYN" });
  // g.setEdge("LISTEN",     "SYN SENT",   { label: "send" });
  // g.setEdge("LISTEN",     "CLOSED",     { label: "close" });
  // g.setEdge("SYN RCVD",   "FINWAIT-1",  { label: "close" });
  // g.setEdge("SYN RCVD",   "ESTAB",      { label: "rcv ACK of SYN" });
  // g.setEdge("SYN SENT",   "SYN RCVD",   { label: "rcv SYN" });
  // g.setEdge("SYN SENT",   "ESTAB",      { label: "rcv SYN, ACK" });
  // g.setEdge("SYN SENT",   "CLOSED",     { label: "close" });
  // g.setEdge("ESTAB",      "FINWAIT-1",  { label: "close" });
  // g.setEdge("ESTAB",      "CLOSE WAIT", { label: "rcv FIN" });
  // g.setEdge("FINWAIT-1",  "FINWAIT-2",  { label: "rcv ACK of FIN" });
  // g.setEdge("FINWAIT-1",  "CLOSING",    { label: "rcv FIN" });
  // g.setEdge("CLOSE WAIT", "LAST-ACK",   { label: "close" });
  // g.setEdge("FINWAIT-2",  "TIME WAIT",  { label: "rcv FIN" });
  // g.setEdge("CLOSING",    "TIME WAIT",  { label: "rcv ACK of FIN" });
  // g.setEdge("LAST-ACK",   "CLOSED",     { label: "rcv ACK of FIN" });
  // g.setEdge("TIME WAIT",  "CLOSED",     { label: "timeout=2MSL" });

  // // Set some general styles
  // g.nodes().forEach(function(v) {
  //   var node = g.node(v);
  //   node.rx = node.ry = 5;
  // });

  // // Add some custom colors based on state
  // g.node('CLOSED').style = "fill: #f77";
  // g.node('ESTAB').style = "fill: #7f7";

  // var svg = d3.select("svg"),
  //     inner = svg.select("g");

  // // Set up zoom support
  // var zoom = d3.zoom().on("zoom", function() {
  //       inner.attr("transform", d3.event.transform);
  //     });
  // svg.call(zoom);

  // // Create the renderer
  // var render = new dagreD3.render();

  // // Run the renderer. This is what draws the final graph.
  // render(inner, g);

  // // Center the graph
  // var initialScale = 0.75;
  // svg.call(zoom.transform, d3.zoomIdentity.translate((svg.attr("width") - g.graph().width * initialScale) / 2, 20).scale(initialScale));

  // svg.attr('height', g.graph().height * initialScale + 40);




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
    </div>
  ));

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
});
