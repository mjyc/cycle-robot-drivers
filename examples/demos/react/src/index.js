import xs from "xstream";
import delay from "xstream/extra/delay";
import React from "react";
import ReactDOM from "react-dom";
import { selectionDriver } from "cycle-selection-driver";
import { makeComponent } from "@cycle/react";
import { div, p, button, br, source } from "@cycle/react-dom";

import { makeTabletFaceDriver } from "@cycle-robot-drivers/screen";

function highlighter(sources) {
  const left = Symbol();
  const right = Symbol();

  const text$ = sources.react.props().map(p => p.text);
  const moveLeft$ = sources.react.select(left).events("click");
  const moveRight$ = sources.react.select(right).events("click");

  const initialState = { text: "", start: 4, end: 8 };
  const state$ = xs
    .merge(
      text$.map(text => prevState => ({ ...prevState, text })),

      moveLeft$.mapTo(prevState => ({
        ...prevState,
        start: Math.max(prevState.start - 1, 0),
        end: Math.max(prevState.end - 1, prevState.end - prevState.start)
      })),

      moveRight$.mapTo(prevState => ({
        ...prevState,
        start: Math.min(
          prevState.start + 1,
          prevState.text.length + prevState.start - prevState.end
        ),
        end: Math.min(prevState.end + 1, prevState.text.length)
      }))
    )
    .fold((state, fn) => fn(state), initialState);

  const elem$ = state$.map(state =>
    div([
      p("#selection-target", [state.text]),
      br(),
      button(left, "move left"),
      button(right, "move right")
    ])
  );

  const selection$ = state$.map(state => ({
    startNode: "#selection-target",
    startOffset: state.start,
    endNode: "#selection-target",
    endOffset: state.end
  }));

  return {
    react: elem$,
    selection: selection$
  };
}

const Highlighter = makeComponent(highlighter, {
  selection: selectionDriver
});

function robotFace(sources) {
  return {
    TabletFace:xs.of({type: 'EXPRESS', value: 'happy'}).compose(delay(2000)),
    react: sources.TabletFace.react,
  }
}

const Robot = makeComponent(robotFace, {TabletFace: makeTabletFaceDriver({useReact: true})});

function App(props) {
  return (
    <div className="app">
      <Highlighter text={"The book is on the table."} />
      <Robot />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
