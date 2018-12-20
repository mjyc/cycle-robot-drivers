import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {run} from '@cycle/run';
import {isEqualResult} from '@cycle-robot-drivers/action';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import FlowchartAction from './FlowchartAction';

function main(sources) {
  const state$ = sources.state.stream;
  state$
    .filter(s => !!s.FlowchartAction 
      && !!s.FlowchartAction.outputs
      && !!s.FlowchartAction.outputs.result)
    .map(s => s.FlowchartAction.outputs.result)
    .compose(dropRepeats(isEqualResult))
    .addListener({
      next: r => console.log('result', r)
    });

  const goal$ = xs.of({}).compose(delay(2000));
  
  // create action components
  const fcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    state: sources.state,
    goal: goal$,
    SpeechSynthesisAction: {
      result: state$
        .map(s => s.SpeechSynthesisAction.result)
        .filter(r => !!r)
        .compose(dropRepeats(isEqualResult)),
    },
    SpeechRecognitionAction: {
      result: state$
        .map(s => s.SpeechRecognitionAction.result)
        .filter(r => !!r)
        .compose(dropRepeats(isEqualResult)),
    },
  });
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: fcSinks.outputs.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  const speechRecognitionAction = SpeechRecognitionAction({
    goal: fcSinks.outputs.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition,
  });

  // define reducers
  const reducer$ = xs.merge(
    xs.of(function () {  // initReducer
      return {
        SpeechSynthesisAction: {result: null},
        SpeechRecognitionAction: {result: null},
      };
    }),
    speechSynthesisAction.result
      .map(result => function (prevState) {
        return {...prevState, SpeechSynthesisAction: {result}}
      }),
    speechRecognitionAction.result
      .map(result => function (prevState) {
        return {...prevState, SpeechRecognitionAction: {result}}
      }),
    fcSinks.state,
  );

  return {
    SpeechSynthesis: speechSynthesisAction.output,
    SpeechRecognition: speechRecognitionAction.output,
    state: reducer$,
  }
}

run(withState(main), {
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});
