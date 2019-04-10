// NOTE: might be called twice if transition and emission fncs are called separately
export function transition(state, input) {
  if (state === 'S0' && input.type === 'START') {
    return {
      state: 'S1',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Hello" when you are ready',
        HumanSpeechbubbleAction: ['Hello'],
      },
    };
  } else if (state === 'S1' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Hello') {
    return {
      state: 'S2',
      outputs: {
        RobotSpeechbubbleAction: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpeechbubbleAction: ['Pause'],
        SpeechSynthesisAction: 'PROFESSOR ARCHIE MAKES A BANG',
      },
    };
  } else if (state === 'S2' && input.type === 'SpeechSynthesisAction'
      && input.status === 'SUCCEEDED') {
    return {
      state: 'S3',
      outputs: {
        RobotSpeechbubbleAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpeechbubbleAction: ['Pause'],
        SpeechSynthesisAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
      },
    };
  } else if (state === 'S3' && input.type === 'SpeechSynthesisAction'
      && input.status === 'SUCCEEDED') {
    return {
      state: 'S4',
      outputs: {
        RobotSpeechbubbleAction: 'The END',
        HumanSpeechbubbleAction: '',
        SpeechSynthesisAction: 'The END',
      },
    };


  } else if (state === 'S2' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Pause') {
    return {
      state: 'SP2',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Resume" when you are ready',
        HumanSpeechbubbleAction: ['Resume'],
        SpeechSynthesisAction: ' ',
      },
    };
  } else if (state === 'S3' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Pause') {
    return {
      state: 'SP3',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Resume" when you are ready',
        HumanSpeechbubbleAction: ['Resume'],
        SpeechSynthesisAction: ' ',
      },
    };
  } else if (state === 'S4' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Pause') {
    return {
      state: 'SP4',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Resume" when you are ready',
        HumanSpeechbubbleAction: ['Resume'],
      },
    };


  } else if (state === 'SP2' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Resume') {
    return {
      state: 'S2',
      outputs: {
        RobotSpeechbubbleAction: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpeechbubbleAction: ['Pause'],
        SpeechSynthesisAction: 'PROFESSOR ARCHIE MAKES A BANG',
      },
    };
  } else if (state === 'SP3' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Resume') {
    return {
      state: 'S3',
      outputs: {
        RobotSpeechbubbleAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpeechbubbleAction: ['Pause'],
        SpeechSynthesisAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
      },
    };
  } else if (state === 'SP4' && input.type === 'HumanSpeechbubbleAction'
      && input.status === 'SUCCEEDED' && input.result === 'Resume') {
    return {
      state: 'S4',
      outputs: {
        RobotSpeechbubbleAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpeechbubbleAction: ['Pause'],
        SpeechSynthesisAction:
            'Professor Archie thinks a lot.\nHe thinks of things to make.',
      },
    };
  } else {
    return {
      state,
      outputs: null,
    };
  }
};
