import { div, h4, pre, makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/run";
import { makeMeydaDriver } from "cycle-meyda-driver";

function main(sources) {
  sources.Meyda.addListener({ next: f => console.log(f) });

  const vdom$ = sources.Meyda.map(features =>
    div([
      h4("Meyda Audio Features"),
      pre(
        Object.keys(features).map(
          key => `${key}: ${JSON.stringify(features[key])}\n`
        )
      )
    ])
  );
  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver("#app"),
  Meyda: makeMeydaDriver({
    featureExtractors: [
      "rms",
      "energy",
      "spectralSlope",
      "spectralCentroid",
      "spectralRolloff",
      "spectralFlatness",
      "spectralSpread",
      "spectralSkewness",
      "spectralKurtosis",
      "zcr",
      "loudness",
      "perceptualSpread",
      "perceptualSharpness",
      "mfcc",
      "chroma",
      "powerSpectrum"
    ]
  })
});
