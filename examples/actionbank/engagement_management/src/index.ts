import {runRobotProgram} from '@cycle-robot-drivers/run';
import EngagementManagement from './EngagementManagement';

function main(sources) {
  document.body.style.backgroundColor = "white";
  document.body.style.margin = "0px";

  return EngagementManagement(sources);
}

runRobotProgram(main);