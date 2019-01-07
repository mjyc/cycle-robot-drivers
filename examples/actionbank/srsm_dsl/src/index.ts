import xs from 'xstream';
import {mermaidAPI} from "mermaid";
import {div, source} from '@cycle/dom';
import {runRobotProgram} from '@cycle-robot-drivers/run';

mermaidAPI.initialize({
  startOnLoad: false
});

function main(sources) {
  document.body.style.backgroundColor = "white";
  document.body.style.margin = "0px";

  const vdom$ = xs.combine(
    sources.TabletFace.DOM.debug(),
    sources.PoseDetection.DOM.debug()
  ).map(([face, poseDetectionViz]) => {
    (poseDetectionViz as any).data.style.display = true//options.hidePoseViz
      ? 'none' : 'block';
    return div({
      style: {position: 'relative'}
    }, [face as any, poseDetectionViz as any, div(`#graphDiv`, 'Graph will be here!')]);
  });

  sources.DOM.select('#graphDiv').element().take(1).addListener({next: e => {
    var graphDefinition = "graph LR\na-->b";

    var insertSvg = function(svgCode, bindFunctions) {
      e.innerHTML = svgCode;
    };

    var graph = mermaidAPI.render("graphDiv", graphDefinition, insertSvg);
    console.error(e);
  }})

  return {
    DOM: vdom$,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

runRobotProgram(main);