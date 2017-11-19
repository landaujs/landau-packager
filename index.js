var express = require('express');
var bodyParser = require('body-parser');
var decache = require('decache');

var Landau = require('@landaujs/landau');

var app = express();
app.use(bodyParser.json());

// build class (e.g. as exported from module)
function buildClassOrElement(obj) {
  if (obj.constructor.name === "Function") {
    return new obj();
  } else {
    return obj.build();
  }
}

function buildWithPos(obj, fullPos) {
  var built;
  var pos = fullPos;
  if (obj.constructor.name === "Object") {
    var allBuilt = Object.keys(obj).map(function(key) {
      return buildClassOrElement(obj[key]);
    })
    // Dirty dirty hacks
    built = {
      props: {
        children: allBuilt,
      },
      tree: () => ({
        elementName: 'Module root',
        props: {},
        children: allBuilt.map(n => n.tree()),
      }),
      render: () => ({
        polygons: [],
      }),
    };
  } else {
    built = buildClassOrElement(obj);
  }

  if (pos.length >= 1) {
    for (var i = 0; i <= pos.length - 1; i++) {
      built = built.props.children[pos[i]];
    }
  }

  return built;
}

app.post('/render', function (req, res) {
  console.log('Module ', req.body.module_path, '- render', 'pos', req.body.pos);
  decache(req.body.module_path);
  var obj = require(req.body.module_path);

  try {
    var pos = req.body.pos || [];
    var built = buildWithPos(obj, pos);

    var result = built.render();
    result.type = 'csg'; // needs to be added so it can be parsed as a CSG object
    res.send(JSON.stringify(result));
  } catch (e) {
    console.error('ERROR', e);
  }
});

app.post('/tree', function (req, res) {
  console.log('Module ', req.body.module_path, '- tree', 'pos', req.body.pos);
  decache(req.body.module_path);
  var obj = require(req.body.module_path);

  try {
    var pos = req.body.pos || [];
    var built = buildWithPos(obj, pos);

    var result = built.tree();
    res.send(JSON.stringify(result));
  } catch (e) {
    console.error('ERROR', e);
  }
});

console.log("Landau packager started on port 1938");
app.listen(1938);
