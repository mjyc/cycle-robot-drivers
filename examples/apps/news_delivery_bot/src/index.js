import { makeHTTPDriver } from "@cycle/http";
import { runTabletRobotFaceApp } from "@cycle-robot-drivers/run";

function main(sources) {
  const apiKey = ""; // News API (https://newsapi.org) API key
  const request$ = sources.TabletFace.events("load").mapTo({
    url: `https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`,
    category: "newsapi"
  });

  const maxArticle = 5;
  const goal$ = sources.HTTP.select("newsapi")
    .flatten()
    .filter(
      response =>
        response.statusText === "OK" &&
        JSON.parse(response.text).articles.length > 0
    )
    .map(response => {
      const articles = JSON.parse(response.text).articles.slice(0, maxArticle);
      const summary = articles.reduce((acc, article, index) => {
        return (
          acc +
          (index === 0 ? " First headline, " : ". Next headline, ") +
          article.title
        );
      }, `Here are top ${articles.length} news headlines.`);
      return summary;
    });

  return {
    SpeechSynthesisAction: { goal: goal$ },
    HTTP: request$
  };
}

runTabletRobotFaceApp(main, {
  HTTP: makeHTTPDriver()
});
