import xs from 'xstream';
import {mermaidAPI} from "mermaid";
import {div} from '@cycle/dom';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {initializeDrivers, withRobotActions} from '@cycle-robot-drivers/run';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';

mermaidAPI.initialize({
  startOnLoad: false
});

function Robot(sources) {
  return {
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

function main(sources) {
  document.body.style.backgroundColor = "white";
  document.body.style.margin = "0px";


  // setup mermaidAPI
  const sinks: any = withRobotActions(Robot, {hidePoseViz: true})(sources);
  const vdom$ = sinks.DOM.map(face =>
    div([face, div(`#graphDiv`)]));

  mermaidAPI.initialize({startOnLoad: true});

  sources.DOM.select('#graphDiv').element().take(1).addListener({next: elem => {
    const graphDefinition = "graph LR\na-->b";
    const insertSvg = (svgCode) => {
      elem.innerHTML = svgCode;
    };
    mermaidAPI.render("graphDiv", graphDefinition, insertSvg);
  }});


  // fetch data
  const data$ = xs.fromPromise(fetch('/fsms/sandbox.txt', {headers: {
    "content-type": "text/plain"
  }})).map(v => xs.fromPromise(v.text())).flatten();
  data$.addListener({next: d => console.log('data$', d)});


  return {
    ...sinks,
    DOM: vdom$,
  };
}

run(
  withState(main),
  initializeDrivers({
    TabletFace: makeTabletFaceDriver({styles: {
      faceWidth: '960px',
      faceHeight: '600px'
    }})
  }),
);