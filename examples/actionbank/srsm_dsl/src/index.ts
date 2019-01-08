import xs from 'xstream';
import mermaid from "mermaid";
import pegjs from 'pegjs';
import {div} from '@cycle/dom';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {initializeDrivers, withRobotActions} from '@cycle-robot-drivers/run';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';

const grammar = `
fsm
  = _ head:transition tail:(brp transition)* _ {
      return {
        type: "fsm",
        value: tail.reduce(function(acc, x) {
          return acc.concat(x[1]);
        }, [head])
      };
    }

transition
  = ws from:state ws a:action ws "->" ws i:input ws to:state {
      return {
        type: "transition",
        value: [from, a, i, to]
      };
    }

state
  = id:[a-zA-Z0-9]+ {
      return {type: "state", value: id.join("")};
    }

action
  = "[" ws action:(speak / displayMessage) ws "]" { return action; }

speak
  = "speak" ws "\\"" arg:[a-zA-Z0-9']+ "\\"" {
      return {
        type: "speak",
        value: arg.join("")
      };
    }

displayMessage
  = "displayMessage" ws "\\"" arg:[a-zA-Z0-9']+ "\\"" {
      return {
        type: "displayMessage",
        value: arg.join("")
      };
    }

input
  = "|" ws input:(speakDone / displayMessageDone) ws "|" { return input; }

speakDone
  = "speakDone" {
      return {
        type: "speakDone",
        value: null
      };
    }

displayMessageDone
  = "displayMessageDone" {
      return {
        type: "displayMessageDone",
        value: null
      };
    }

_ "blank" = [ \\t\\r\\n]*

ws "whitespace" = [ \\t]*

brp "linebreak" = [\\r\\n]+
`;

function Robot(sources) {
  return {
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

function toMermaid(node) {
  if (node.type === 'transition') {
    return node.value[0].value + '[\"'  + node.value[1].value + '\"]'
      + '--> |' + node.value[2].value + '| ' + node.value[3].value;
  } else if (node.type === 'fsm') {
    return node.value.map(toMermaid).join('\n');
  }
}

function main(sources) {
  document.body.style.backgroundColor = 'white';
  document.body.style.margin = '0px';

  // fetch & parse code
  const code$ = xs.fromPromise(fetch('/fsms/sandbox.txt', {headers: {
    'content-type': 'text/plain'
  }})).map(v => xs.fromPromise(v.text())).flatten();

  const parser = pegjs.generate(grammar);
  const sinks: any = withRobotActions(Robot, {hidePoseViz: true})(sources);
  const vdom$ = xs.combine(sinks.DOM, code$).map(([face, code]) => {
    let ast;
    try {
      ast = parser.parse(code);
    } catch (e) {
      console.log(`Parsing error on line ${e.location.start.line}:
...${code.split('\n')[e.location.start.line-1]}
${'-'.repeat(3+e.location.start.column-1) + '^'}
${e.message}`);
    }
    return div([div('#graphDiv', 'graph TB\n' + toMermaid(ast)), face]);
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