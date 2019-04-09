export function transition(state, input) {
  if (state === 'S0' && input.type === 'START') {
    return {
      state: 'S1',
      output: {
        RobotSpechbubble: 'Tap "Hello" when you are ready',
        HumanSpechbubble: ['Hello'],
      },
    };
  } else if (state === 'S1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S2',
      output: {
        robotSpeechbubble: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpechbubble: ['Pause'],
      },
    };
  } else if (state === 'S2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S3',
      output: {
        robotSpeechbubble: 'Professor Archie thinks a lot.\nHe thinks of things to make.", speak "Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpechbubble: ['Pause'],
      },
    };
  } else if (state === 'S3' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Hello') {
    return {
      state: 'S4',
      output: {
        robotSpeechbubble: 'The END',
      },
    };


  } else if (state === 'S1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Pause') {
    return {
      state: 'SP1',
      output: {
        RobotSpechbubble: 'Tap "Resume" when you are ready',
        HumanSpechbubble: ['Resume'],
      },
    };
  } else if (state === 'S2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Pause') {
    return {
      state: 'SP2',
      output: {
        RobotSpechbubble: 'Tap "Resume" when you are ready',
        HumanSpechbubble: ['Resume'],
      },
    };
  } else if (state === 'SP1' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Resume') {
    return {
      state: 'S1',
      output: {
        RobotSpechbubble: 'PROFESSOR ARCHIE MAKES A BANG',
        HumanSpechbubble: ['Pause'],
      },
    };
  } else if (state === 'SP2' && input.type === 'HUMAN_SPEECHBUBBLE' && input.value === 'Resume') {
    return {
      state: 'S2',
      output: {
        RobotSpechbubble: 'Professor Archie thinks a lot.\nHe thinks of things to make.", speak "Professor Archie thinks a lot.\nHe thinks of things to make.',
        HumanSpechbubble: ['Pause'],
      },
    };
  }
};
