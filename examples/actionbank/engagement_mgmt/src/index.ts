import {runRobotProgram} from '@cycle-robot-drivers/run';
import EngagementManagementApp from './EngagementManagementApp';

function main(sources) {
  document.body.style.backgroundColor = "white";
  document.body.style.margin = "0px";

  return EngagementManagementApp(sources);
}

runRobotProgram(main);