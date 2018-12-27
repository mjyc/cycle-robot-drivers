import {run} from '@cycle/run';
import {makeMeydaDriver} from 'cycle-meyda-driver';

function main(sources) {
  sources.Meyda.addListener({next: f => console.log(f)});
  return {};
}

run(main, {
  Meyda: makeMeydaDriver(),
});
