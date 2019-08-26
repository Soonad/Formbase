const express = require("express")
const app = express()
const port = process.argv[2] || 80;
const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");

const fm_file_path = file_name => {  
  return path.join(__dirname, "..", "fm", file_name + ".fm");
};

const fm_save_file = (async function save(file_name, file_code, version = 0) {
  var file_path = fm_file_path(file_name + "@" + version);
  var last_file_path = version > 0 ? fm_file_path(file_name + "@" + (version - 1)) : null;
  if (fs.existsSync(file_path)) {
    return save(file_name, file_code, version + 1);
  } else {
    try {
      if (version > 0) {
        var last_file_code = await fsp.readFile(last_file_path, "utf8");
        if (file_code === last_file_code) {
          return file_name + "@" + (version - 1);
        }
      }
      await fsp.writeFile(file_path, file_code);
      return file_name + "@" + version;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
});

const fm_load_file = (async function load(file_name_v) {
  try {
    var file_path = fm_file_path(file_name_v);
    if (fs.existsSync(file_path)) {
      return await fsp.readFile(file_path, "utf8");
    } else {
      return null;
    }
  } catch (e) {
    return null;
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
      console.log("saved " + result + ": " + code.length + " chars");
      res.send(JSON.stringify(["ok", result]))
    })
    .catch(e => res.send(JSON.stringify(["err"])));
});

app.post("/api/load_file", (req, res) => {
  var file = req.body.file;
  fm_load_file(file)
    .then(result => res.send(JSON.stringify(["ok", result])))
    .catch(e => res.send(JSON.stringify(["err"])));
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
