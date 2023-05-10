//Install express server
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const https = require('https');
const compression = require('compression');
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'text/*' }))
app.use(compression());
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');
const appPath = '/dist/ng-visuall';
app.use(express.static(__dirname + appPath));



const proxyConfig = require(path.join(__dirname, 'proxy.conf.json'));

const proxy = createProxyMiddleware(proxyConfig['/rest/*']);
/*
app.use('/rest', createProxyMiddleware({
  target: 'https://saanalyzer.atlassian.net',
  changeOrigin: true,
  secure: true, 
  headers: {
    "Access-Control-Allow-Origin": "*",
    "X-Atlassian-Token": "no-check"
  },
  pathRewrite: {
    '^/rest': ''
  }
}));



const proxy = createProxyMiddleware({
  target: 'https://saanalyzer.atlassian.net',
  changeOrigin: true,
  secure: true, 
  headers: {
    "Access-Control-Allow-Origin": "*",
    "X-Atlassian-Token": "no-check"
  },
  pathRewrite: {
    '^/rest': ''
  }
});
*/

app.use('/rest', proxy);

app.get('/urlquery/*', function (req, res) {
  let reqURL = req.url.substr(10);
  const data = [];
  if (reqURL.substr(0, 5).toLowerCase() != "https" && reqURL.substr(0, 4).toLowerCase() == "http") {
    let request = http.request(reqURL, function (response, body) {
      response.on('data', function (chunk) {
        data.push(chunk);
      });
      response.on('end', function () {
        let result = JSON.parse(data.join(''))
        res.send(result);

      });
    });
    request.on('error', function (e) {
      console.log(e.message);
    });
    request.end();
  }
  else {
    if (reqURL.substr(0, 4).toLowerCase() != "http") {
      reqURL = "https://" + reqURL;
    }
    let request = https.request(reqURL, function (response, body) {
      response.on('data', function (chunk) {
        data.push(chunk);
      });
      response.on('end', function () {
        try {
          const result = JSON.parse(data.join(''))
          res.send(result);
        } catch (e) {
          res.send('{}');
        }

      });
    });
    request.on('error', function (e) {
      console.log(e.message);
    });
    request.end();
  }
});

app.get('/e2e', function (req, res) {
  res.sendFile(path.join(__dirname + '/e2e-results.txt'));
});

app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname + appPath + '/index.html'));
});
/*

const options = {
  cert: fs.readFileSync('./server-cert.pem'),
  ca: fs.readFileSync('./ca-cert.pem')
};

app.use('/rest/*', createProxyMiddleware({
  target: 'https://saanalyzer.atlassian.net',
  secure:false,
  changeOrigin: true,
  followRedirects: true,
  logLevel: 'debug',
  onError: function(err, req, res) {
    console.log('Proxy error:', err);
    res.writeHead(500, {
      'Content-Type': 'text/plain'
    });
    res.end('Proxy error');
  }
}));


*/
const port = process.env.PORT || 4400;
app.listen(port);
// Start the app by listening on the default port
console.log('server listening port: ', port);
