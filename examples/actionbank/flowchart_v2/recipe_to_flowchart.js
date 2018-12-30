if (process.argv.length < 4) {
  console.error('usage: node json_to_flowchart.js infile.json outfile.json');
  process.exit(1);
}

var fs = require('fs');

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

fs.readFile(process.argv[2], function(err, data) {
  const d = JSON.parse(data.toString());

  const startId = uuidv4();
  const out = {
    flowchart: [].concat([
      {
        id: startId,
        type: 'MONOLOGUE',
        arg: `Let's make ${d.title}`,
      },
      {
        id: uuidv4(),
        type: 'MONOLOGUE',
        arg: `You will need`,
      },
    ], d.ingredients.map(inst => ({
      id: uuidv4(),
      type: 'INSTRUCTION',
      arg: inst,
    })), {
      id: uuidv4(),
      type: 'MONOLOGUE',
      arg: `Let's start!`,
    }, d.directions.map(inst => ({
      id: uuidv4(),
      type: 'INSTRUCTION',
      arg: inst,
    }))),
    start_id: startId,
  };
  out.flowchart.map((node, i, arr) => {
    if (i === 0) return;
    arr[i-1].next = arr[i].id;
  })
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
});

