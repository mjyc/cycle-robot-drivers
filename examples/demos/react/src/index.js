import xs from "xstream";
import delay from "xstream/extra/delay";
import React from "react";
import ReactDOM from "react-dom";
import { makeComponent } from "@cycle/react";
import { makeTabletFaceDriver } from "@cycle-robot-drivers/screen";

function robotFace(sources) {
  return {
    TabletFace:xs.of({type: 'EXPRESS', value: 'happy'}).compose(delay(2000)),
    react: sources.TabletFace.react,
  }
}

const RobotFace = makeComponent(robotFace, {
  TabletFace: makeTabletFaceDriver()
});

function App(props) {
  return (
    <div className="app">
      <Highlighter text={"The book is on the table."} />
      <RobotFace />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
