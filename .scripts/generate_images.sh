#!/usr/bin/env bash

if ! type dot > /dev/null; then
  echo "You need to install GraphViz (http://www.graphviz.org/)";
  exit 1;
fi

dot -Tsvg docs/travel_personality_quiz_fsm.dot -o docs/travel_personality_quiz_fsm.svg
