import {mockTimeSource} from '@cycle/time';
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';

describe('SpeechSynthesisAction', () => {
  it('xxx', (done) => {
    const Time = mockTimeSource();

    // const addClick$      = Time.diagram(`---x--x-------x--x--|`);
    // const subtractClick$ = Time.diagram(`---------x----------|`);
    // const expectedCount$ = Time.diagram(`0--1--2--1----2--3--|`);

    // const DOM = mockDOMSource({
    //   '.add': {
    //     click: addClick$
    //   },

    //   '.subtract': {
    //     click: subtractClick$
    //   },
    // });

    const sendGoal$ =   Time.diagram(`---x---|`);
    const events = {
      start:            Time.diagram(`----x--|`),
      end:              Time.diagram(`-----x-|`),
      error:              Time.diagram(`-----x-|`),
    }
    sendGoal$.mapTo({text: 'Hello'});



    const speechSynthesisAction = SpeechSynthesisAction({
      goal: sendGoal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    speechSynthesisAction.result.addListener({
      next: data => console.warn('result', data),
    });

    // const count$ = counter.DOM.map(vtree => select('.count', vtree)[0].text);

    // Time.assertEqual(count$, expectedCount$);

    Time.run(done);
  });
});
