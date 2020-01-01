// TODO: this file isn't very well-coded and needs better abstractions
const app = require('./app.js')
const http = require('http')
const { createTerminus } = require('@godaddy/terminus')

const port = process.env.PORT || process.argv[2] || 80;
// Shutdown Delay should be set when using k8s to avoid race conditions.
// This should be set to something bigger than the readiness probe
const shutdownDelay = process.env.SHUTDOWN_DELAY || 0;

const server = http.createServer(app)

// TODO: Implement real healtchecks and cleanups

function beforeShutdown() {
  return new Promise(resolve => setTimeout(resolve, shutdownDelay))
}

// Right now we don't have any cleaning up to do, but if we add some persisten things like a pool
// of data or something like that the termination of that should be done here.
function onSignal() {
  console.log('server is starting cleanup');
}

function onShutdown () {
  console.log('cleanup finished, server is shutting down');
}

// Liveness probes should be really simple. A failure here will cause the service to restart.
function liveness() {
  return Promise.resolve({});
}

// Right now we don't have any health checking, but readiness shold check that everything it needs
// to operate is ready. For example, it may wait for database connections.
function readiness() {
  return Promise.resolve({});
}

const options = {
  signals: ["SIGINT", "SIGTERM"],
  onSignal,
  onShutdown,
  beforeShutdown,
  healthChecks: {
    '/health/alive': liveness,
    '/health/ready': readiness,
    verbatim: true
  }
};

createTerminus(server, options);

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
