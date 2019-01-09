import pegjs from 'pegjs';

const grammar = `
fsm
  = _ head:transition tail:(br transition)* _ {
      return {
        type: "fsm",
        value: tail.reduce((acc, x) => acc.concat(x[1]), [head]),
      };
    }

transition
  = ws from:state ws "->" ws i:input ws to:state ws a:actions ws {
      return {
        type: "transition",
        value: [from, i, to, a],
      };
    }

state
  = id:[a-zA-Z0-9]+ {
      return {
        type: "state",
        value: id.join(""),
      };
    }

actions
  = "[" ws head:action ws tail:(ws "," ws action)* ws "]" {
      return {
        type: 'actions',
        value: [
          head,
          ...tail.map(t => t[3]),
        ],
      };
    }

action
  = action:(speak / displayMessage / askQuestion) {
      return action;
    }

speak
  = "speak" ws "\\"" arg:[ a-zA-Z0-9?]+ "\\"" {
      return {
        type: "speak",
        value: arg.join(""),
      };
    }

displayMessage
  = "displayMessage" ws "\\"" arg:[ a-zA-Z0-9?]+ "\\"" {
      return {
        type: "displayMessage",
        value: arg.join(""),
      };
    }

askQuestion
  = "askQuestion" ws "\\"" head:[ a-zA-Z0-9?]+ "\\"" tail:(ws "\\"" [ a-zA-Z0-9?]+ "\\"")* {
      return {
        type: "askQuestion",
        value: [
          head.join(""),
          ...tail.map(t => t[2].join("")),
        ],
      };
    }

input
  = "|" ws input:(started / speakDone / askQuestionDone) ws "|" {
      return {
        type: 'input',
        value: input,
      };
    }

started
  = "started" {
      return {
        type: "started",
        value: null,
      };
    }

speakDone
  = "speakDone" {
      return {
        type: "speakDone",
        value: null,
      };
    }

askQuestionDone
  = "askQuestionDone" {
      return {
        type: "askQuestionDone",
        value: null,
      };
    }

_ "blank" = [ \\t\\r\\n]*

ws "whitespace" = [ \\t]*

br "linebreak" = [\\r\\n]+
`;

export const parser = pegjs.generate(grammar);

export function compileToMermaid(tree) {
  if (tree.type === 'started') {
    return `${tree.type}`;
  } else if (tree.type === 'speakDone') {
    return `${tree.type}`;
  } else if (tree.type === 'askQuestionDone') {
    return `${tree.type}`;
  } else if (tree.type === 'input') {
    return `|${compileToMermaid(tree.value)}|`;
  } else if (tree.type === 'speak') {
    return `${tree.type}: ${tree.value}`;
  } else if (tree.type === 'askQuestion') {
    return `${tree.type}: ${tree.value}`;
  } else if (tree.type === 'actions') {
    return `[${compileToMermaid(tree.value[0])}]`
  } else if (tree.type === 'state') {
    return `${tree.value}`;
  } else if (tree.type === 'transition') {
    return `${compileToMermaid(tree.value[0])} --> ${compileToMermaid(tree.value[1])} ${compileToMermaid(tree.value[2])}${compileToMermaid(tree.value[3])}`;
  } else if (tree.type === 'fsm') {
    return tree.value.map(compileToMermaid).join('\n');
  }
}