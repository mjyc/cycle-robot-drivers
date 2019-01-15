import xs from 'xstream';
import mermaid from "mermaid";
import {div, button, pre} from '@cycle/dom';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {initializeDrivers, withRobotActions} from '@cycle-robot-drivers/run';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';
import Robot from './Robot';
import {parser, compileToMermaid} from './utils';


function main(sources) {
  document.body.style.backgroundColor = 'white';
  document.body.style.margin = '0px';

  // fetch & parse code
  const code$ = xs.fromPromise(fetch('/fsms/sandbox.txt', {headers: {
    'content-type': 'text/plain'
  }})).map(v => xs.fromPromise(v.text())).flatten();

  const goal$ = xs.combine(
    code$,
    sources.DOM.select('button#start').events('click', {preventDefault: true}),
  ).map(([code, click]) => code);

  const sinks: any = withRobotActions(Robot, {hidePoseViz: true})({
    ...sources,
    goal: goal$,
  });

  const vdom$ = xs.combine(sinks.DOM, code$).map(([face, code]) => {
    let ast;
    let errMsg = null;
    try {
      ast = parser.parse(code);
    } catch (e) {
      errMsg = `Parsing error on line ${e.location.start.line}:
...${code.split('\n')[e.location.start.line-1]}
${'-'.repeat(3+e.location.start.column-1) + '^'}
${e.message}`;
    }
    return div([
      face,
      button('#start', 'Start'),
      !!errMsg
        ? pre(errMsg)
        : div('#graphDiv', 'graph TB\n' + compileToMermaid(ast)),
    ]);
  });


  // render code
  sources.DOM.select('#graphDiv').element().addListener({next: elem => {
    if (elem.children.length === 0) {
      elem.removeAttribute('data-processed');
      mermaid.init({noteMargin: 10}, elem);
    }
  }});

  return {
    ...sinks,
    DOM: vdom$,
  };
}

run(
  withState(main),
  initializeDrivers({
    TabletFace: makeTabletFaceDriver({styles: {
      faceWidth: '640px',
      faceHeight: '400px',
      eyeSize: '133px'
    }})
  }),
);