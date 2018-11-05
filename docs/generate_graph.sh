#!/usr/bin/env bash

if ! type dot > /dev/null; then
  echo "You need to install GraphViz (http://www.graphviz.org/)";
  exit 1;
fi

dot -Tsvg ./travel_personality_quiz_fsm.dot -o ./travel_personality_quiz_fsm.svg
dot -Tsvg ./travel_personality_quiz_fsm_updated.dot -o ./travel_personality_quiz_fsm_updated.svg
dot -Tsvg ./travel_personality_quiz_fsm_final.dot -o ./travel_personality_quiz_fsm_final.svg
