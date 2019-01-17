import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';

export function recordStream(stream$, time$) {
  return stream$.compose(sampleCombine(time$)).fold((events, newEvent) => {
    return events.concat([newEvent]);
  }, []);
}

export default function Bagger(streams, timeSource) {
  const time$ = timeSource.animationFrames().map(frame => frame.time);
  const names = Object.keys(streams);
  const recorded = names.map(k => recordStream(streams[k], time$));
  const combined$ = xs.combine.apply(null, recorded)
    .map(combined => {
      return combined.reduce((out, data, i) => {
        out[names[i]] = data;
        return out;
      }, {});
    });
  return combined$;
}
