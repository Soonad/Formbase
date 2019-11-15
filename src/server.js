// TODO: this file isn't very well-coded and needs better abstractions

const sha3 = require('js-sha3').sha3_256;

const to_base64 = numb => {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ._";
  var bits = numb.toString(2);
  while (bits.length < 24) {
    bits = "0" + bits;
  }
  console.log(bits);
  var bs64 = "";
  for (var i = 0; i < 4; ++i) {
    bs64 += chars[parseInt(bits.slice(i*6, (i+1)*6), 2)];
  }
  return bs64;
};

const suffix = str => {
  return to_base64(parseInt(sha3(str).slice(-6), 16));
};

const express = require("express")
const app = express()
const port = process.argv[2] || 80;
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const fm_file_path = file_name => {  
  return path.join(__dirname, "..", "fm", file_name + ".fm");
};

const fm_save_file = (async function save(file_name, file_code) {
  var file_hash = suffix(file_code);
  var file_path = fm_file_path(file_name + "#" + file_hash);

  try {
    // Already saved, just return name
    if (fs.existsSync(file_path)) {
      return ["ok", file_name+"#"+file_hash]; // TODO: check if is actually the same file (collison)
    }
    
    var imports = file_code
      .split("\n")
      .filter(line => new RegExp("^import ").test(line))
      .map(line => line.replace("import ", "").trim().replace(new RegExp(" .*"), ""));

    for (var i = 0; i < imports.length; ++i) {
      var import_imported_by_path = fm_file_path(imports[i]) + ".imported_by";
      if (!fs.existsSync(import_imported_by_path)) {
        await fsp.writeFile(import_imported_by_path, "");
      }
      await fsp.appendFile(import_imported_by_path, file_name+"#"+file_hash + "\n");
    }

    await fsp.writeFile(file_path, file_code);
    return ["ok", file_name+"#"+file_hash];
  } catch (e) {
    console.log(e);
    return ["err", "Couldn't save file."];
  }
});

const fm_load_file_parents = (async function load_file_parents(file_name_v) {
  try {
    var file_path = fm_file_path(file_name_v) + ".imported_by";
    //console.log("loading imports:", file_path);
    if (fs.existsSync(file_path)) {
      var imports = (await fsp.readFile(file_path, "utf8")).split("\n");
      imports.pop();
      return ["ok", imports];
    } else {
      return ["ok", []];
    }
  } catch (e) {
    //console.log("error", e);
    return ["err", "Couldn't load imports of '" + file_name_v + "'."];
  }
});


const fm_load_file = (async function load(file_name_v) {
  try {
    var file_path = fm_file_path(file_name_v);
    if (fs.existsSync(file_path)) {
      return ["ok", await fsp.readFile(file_path, "utf8")];
    } else {
      return ["err", "Couldn't find a file named '" + file_name_v + "' on FPM."];
    }
  } catch (e) {
    return ["err", "Couldn't load '" + file_name_v + "'."];
  }
});

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("*", (req, res) => {
  res.sendFile("/docs" + (req.path === "/" ? "/index.html" : req.path), {root: __dirname + "/.."});
});

app.post("/api/save_file", (req, res) => {
  var file = req.body.file;
  var code = req.body.code;
  if (!file || !code) {
    return res.send(JSON.stringify(["err"]))
  }
  fm_save_file(file, code)
    .then(result => {
      if (result[0] === "ok") {
        console.log("Saved " + result[1] + ": " + code.length + " chars");
      }
      return res.send(JSON.stringify(result))
    })
    .catch(e => res.send(JSON.stringify(["err"])));
});

app.post("/api/load_file", (req, res) => {
  var file = req.body.file;
  fm_load_file(file)
    .then(result => res.send(JSON.stringify(result)))
    .catch(e => res.send(JSON.stringify(["err", "Couldn't save file."])));
});

app.post("/api/load_file_parents", (req, res) => {
  var file = req.body.file;
  fm_load_file_parents(file)
    .then(result => res.send(JSON.stringify(result)))
    .catch(e => res.send(JSON.stringify(["err", "Couldn't save file."])));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
