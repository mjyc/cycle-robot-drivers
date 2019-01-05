if (process.argv.length < 4) {
  console.error("usage: node txt_to_json.js infile.txt outfile.json");
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
  if(err) throw err;
  var lines = data.toString().split("\n")
    .map(line => line.trim());
  var startId = uuidv4();
  var out = {
    flowchart: lines
      .map((line, i, arr) => ({
        id: i === 0 ? startId : uuidv4(),
        type: 'MONOLOGUE',
        arg: line,
      }))
      .map((node, i, arr) => ({
        ...node,
        next: (i + 1) !== arr.length ? arr[i+1].id : undefined,
      })),
    start_id: startId,
  };
  fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 2));
});
