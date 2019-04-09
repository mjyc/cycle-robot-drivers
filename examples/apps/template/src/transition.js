export function transition(state, input) {
  if (state === 'S0' && input.type === 'START') {
    return {
      state: 'S1',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Hello" when you are ready',
        HumanSpeechbubbleAction: ['Hello'],
      },
    };
  } else if (state === 'S1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S2',
      outputs: {
        RobotSpeechbubbleAction: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpeechbubbleAction: ['Pause'],
      },
    };
  } else if (state === 'S2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S3',
      outputs: {
        RobotSpeechbubbleAction: 'Professor Archie thinks a lot.\nHe thinks of things to make.", speak "Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpeechbubbleAction: ['Pause'],
      },
    };
  } else if (state === 'S3' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S4',
      outputs: {
        RobotSpeechbubbleAction: 'The END',
      },
    };


  } else if (state === 'S1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Pause') {
    return {
      state: 'SP1',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Resume" when you are ready',
        HumanSpeechbubbleAction: ['Resume'],
      },
    };
  } else if (state === 'S2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Pause') {
    return {
      state: 'SP2',
      outputs: {
        RobotSpeechbubbleAction: 'Tap "Resume" when you are ready',
        HumanSpeechbubbleAction: ['Resume'],
      },
    };
  } else if (state === 'SP1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Resume') {
    return {
      state: 'S1',
      outputs: {
        RobotSpeechbubbleAction: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpeechbubbleAction: ['Pause'],
      },
    };
  } else if (state === 'SP2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Resume') {
    return {
      state: 'S2',
      outputs: {
        RobotSpeechbubbleAction: 'Professor Archie thinks a lot.\nHe thinks of things to make.",e speak "Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpeechbubbleAction: ['Pause'],
      },
    };
  } else {
    return {
      state,
      outputs: null,
    };
  }
};
