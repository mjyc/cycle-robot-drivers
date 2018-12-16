import xs from 'xstream';

export function output(machine$) {
  const outputs$ = machine$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(o => !!o.SpeechRecognitionAction)
      .map(o => o.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(o => !!o.TabletFace)
      .map(o => o.TabletFace.goal),
  };
}
