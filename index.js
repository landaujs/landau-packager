#!/usr/bin/env node
require('@babel/register');
const express = require('express');
const bodyParser = require('body-parser');
const decache = require('decache');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

const Landau = require('@landaujs/landau');
const React = require('react');

var app = express();
app.use(bodyParser.json());
var expressWs = require('express-ws')(app);

const determineEntrypoint = () => {
  const pkgJsonPath = path.join(process.cwd(), "package.json");
  // Check that we are in package root
  if (fs.existsSync(pkgJsonPath)) {
    if (fs.existsSync(path.join(process.cwd(), "index.js"))) {
    return path.join(process.cwd(), "index.js");
    }
    if (fs.existsSync(path.join(process.cwd(), "src/index.js"))) {
    return path.join(process.cwd(), "src/index.js");
    }
  }
}

const ENTRY = determineEntrypoint();
console.log(`Using "${ENTRY}" as entry point`);

let wsClientId = 1;
let wsClients = [];

app.post('/render', function (req, res) {
  const entry = ENTRY;
  console.log('Module ', entry, '- render');
  decache(entry);

  try {
    // TODO: make possible to choose default or other exported key
    var Component = require(entry).default;
    const obj = {};
    Landau.render(React.createElement(Component, {}, null), obj);

    const result = obj.csg;
    res.send(JSON.stringify(result));
  } catch (e) {
    console.error('ERROR', e);
  }
});

app.ws('/render', function (ws, req) {
  console.log("WS client connected");
  const clientId = wsClientId;
  wsClientId += 1;
  wsClients.push({ id: clientId, ws });

  try {
    const entry = ENTRY;
    console.log('Module ', entry, '- render WS connect');
    decache(entry);
    // TODO: make possible to choose default or other exported key
    var Component = require(entry).default;
    const obj = {};
    Landau.render(React.createElement(Component, {}, null), obj);

    const result = obj.csg;
    ws.send(JSON.stringify(result));
  } catch (e) {
    console.error('ERROR', e);
  }

  ws.on('close', () => {
    console.log("WS client disconnected");
    wsClients = wsClients.filter(({ id }) => id !== clientId);
  })
});

chokidar.watch(ENTRY).on('all', (event, path) => {
  const entry = ENTRY;
  console.log('Module ', entry, '- render WS');
  decache(entry);

  try {
    // TODO: make possible to choose default or other exported key
    var Component = require(entry).default;
    const obj = {};
    Landau.render(React.createElement(Component, {}, null), obj);

    const result = obj.csg;
    wsClients.forEach((client) => {
      client.ws.send(JSON.stringify(result));
    })
  } catch (e) {
    console.error('ERROR', e);
  }
});

// app.post('/tree', function (req, res) {
  // console.log('Module ', req.body.module_path, '- tree', 'pos', req.body.pos);
  // decache(req.body.module_path);
  // var obj = require(req.body.module_path);

  // try {
    // var pos = req.body.pos || [];
    // var build = function() {
      // var materialized = Landau.materializeTree(obj);

      // materialized = selecteMaterializedPos(materialized, pos);
      // var result = Landau.renderAsTree(materialized, true);
      // return result;
    // };
    // var result = build();
    // res.send(JSON.stringify(result));
  // } catch (e) {
    // console.error('ERROR', e);
  // }
// });

console.log("Landau packager started on port 1938");
app.listen(1938);
