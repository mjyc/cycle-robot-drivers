import pegjs from 'pegjs';

const grammar = `
fsm
  = _ head:transition tail:(brp transition)* _ {
      return {
        type: "fsm",
        value: tail.reduce(function(acc, x) {
          return acc.concat(x[1]);
        }, [head])
      };
    }

transition
  = ws from:state ws a:action ws "->" ws i:input ws to:state {
      return {
        type: "transition",
        value: [from, a, i, to]
      };
    }

state
  = id:[a-zA-Z0-9]+ {
      return {type: "state", value: id.join("")};
    }

action
  = "[" ws action:(speak / displayMessage / askQuestion) ws "]" {
      return {
        type: 'action',
        value: action,
      };
    }

speak
  = "speak" ws "\\"" arg:[ a-zA-Z0-9?]+ "\\"" {
      return {
        type: "speak",
        value: arg.join("")
      };
    }

displayMessage
  = "displayMessage" ws "\\"" arg:[ a-zA-Z0-9?]+ "\\"" {
      return {
        type: "displayMessage",
        value: arg.join("")
      };
    }

askQuestion
  = "askQuestion" ws "\\"" arg1:[ a-zA-Z0-9?]+ "\\"" ws "\\"" arg2:[ a-zA-Z0-9?]+ "\\"" {
      return {
        type: "askQuestion",
        value: {
          question: arg1.join(""),
          answers: arg2.join("")
        }
      };
    }

input
  = "|" ws input:(speakDone / askQuestionDone) ws "|" {
      return {
        type: 'input',
        value: input
      };
    }

speakDone
  = "speakDone" {
      return {
        type: "speakDone",
        value: null
      };
    }

askQuestionDone
  = "askQuestionDone" {
      return {
        type: "askQuestionDone",
        value: null
      };
    }

_ "blank" = [ \\t\\r\\n]*

ws "whitespace" = [ \\t]*

brp "linebreak" = [\\r\\n]+
`;

const parser = pegjs.generate(grammar);

export default parser;