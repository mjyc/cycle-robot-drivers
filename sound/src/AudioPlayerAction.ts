// import {Observable} from 'rxjs/Observable';
// import xs from 'xstream'
// import dropRepeats from 'xstream/extra/dropRepeats'
// import {adapt} from '@cycle/run/lib/adapt'
// import isolate from '@cycle/isolate';

// import {Goal, GoalStatus, Status} from './types'
// import {initGoal} from './utils'


// function AudioPlayerAction(sources) {
//   // Create action stream
//   type Action = {
//     type: string,
//     value: Goal | string,
//   };

//   const goal$ = (
//     (sources.goal instanceof Observable) ? xs.from(sources.goal) : sources.goal
//   ).map(goal => {
//     if (goal === null) {
//       return {
//         type: 'CANCEL',
//         value: null,  // goal MUST BE null on CANCEL
//       };
//     } else {
//       return {
//         type: 'GOAL',
//         value: initGoal(goal),
//       }
//     }
//   });
//   const event$ = (
//     sources.event instanceof Observable
//       ? xs.from(sources.event) : sources.event
//   );
//   const action$ = xs.merge(goal$, event$);

//   // Create status stream
//   let _status = null;
//   const status$ = xs.createWithMemory({
//     start: listener => {
//       _status = listener;
//     },
//     stop: () => {
//       _status = null;
//     },
//   });

//   // Create result stream
//   let _result = null;
//   const result$ = xs.create({
//     start: listener => {
//       _result = listener;
//     },
//     stop: () => {
//       _result = null;
//     },
//   });

//   // Create state stream
//   type State = {
//     goal: Goal,
//     status: GoalStatus,
//   };

//   const initialState: State = {
//     goal: null,
//     status: {
//       goal_id: {
//         stamp: new Date,
//         id: ''
//       },
//       status: Status.SUCCEEDED,
//     },
//   };

//   const state$ = action$.fold((state: State, action: Action): State => {
//     console.debug('AudioPlayer state', state, 'action', action);
//     if (action.type === 'GOAL' || action.type === 'CANCEL') {
//       let goal: Goal = state.goal;
//       let status: GoalStatus = state.status;
//       if (state.status.status === Status.ACTIVE) {  // preempt the goal
//         status = {
//           goal_id: state.status.goal_id,
//           status: Status.PREEMPTED,
//         };
//         _status && _status.next(status);
//         _result && _result.next({
//           status: Status.PREEMPTED,
//           result: null,
//         });
//       }
//       if (action.type === 'GOAL') { // send a new goal
//         goal = (action.value as Goal);
//         status = {
//           goal_id: goal.goal_id,
//           status: Status.ACTIVE,
//         };
//         _status && _status.next(status);
//       }
//       return {
//         goal,
//         status,
//       }
//     } else if (action.type === 'ENDED' && state.status.status === Status.ACTIVE) {
//       const status: GoalStatus = {
//         goal_id: state.status.goal_id,
//         status: Status.SUCCEEDED,
//       };
//       _status && _status.next(status);
//       _result && _result.next({
//         status: status,
//         result: action.value,
//       });
//       return {
//         ...state,
//         status,
//       }
//     } else {
//       console.warn(`returning "state" as is for action.type: ${action.type}`);
//       return state;
//     }
//   }, initialState);

//   const value$ = state$.map(state => {
//     if (state.status.status === Status.PREEMPTING) {
//       return null;  // cancel signal
//     } else if (state.goal) {
//       return state.goal.goal;
//     }
//   }).compose(dropRepeats());

//   return {
//     value: adapt(value$),
//     status: adapt(status$),
//     result: adapt(result$),
//   };
// }

// const IsolatedAudioPlayerAction = function(sources) {
//   return isolate(AudioPlayerAction)(sources);
// };

// export default IsolatedAudioPlayerAction;
