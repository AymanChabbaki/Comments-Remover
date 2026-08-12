require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { captureRawBody } = require('./middleware/verifySignature');
const webhookRouter = require('./routes/webhook');
const dashboardRouter = require('./routes/dashboard');
const adminRouter = require('./routes/admin');
const demoRouter = require('./routes/demo');
const authRouter = require('./routes/auth');
const db = require('./db');

const app = express();
app.use(express.json({ verify: captureRawBody }));
// The signup/login forms are plain HTML <form> posts (x-www-form-urlencoded),
// not JSON -- webhook/dashboard/admin all speak JSON so express.json()
// alone covered them, but auth needs this too.
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Doesn't depend on the database -- stays fast/independent for basic
// liveness checks regardless of DB state.
app.get('/health', (_req, res) => res.sendStatus(200));

// Schema creation is idempotent (CREATE TABLE IF NOT EXISTS), so running
// it as a memoized before-every-request check works for both a
// long-lived server (runs once, then every later request just awaits
// an already-resolved promise) and serverless (runs once per cold
// start) without needing separate migration steps per deployment target.
let migrated = null;
app.use((req, res, next) => {
  if (!migrated) {
    migrated = db.migrate().catch((err) => {
      migrated = null;
      throw err;
    });
  }
  migrated.then(() => next()).catch(next);
});

app.use('/webhook', webhookRouter);
app.use('/webhook', dashboardRouter);
app.use('/webhook', adminRouter);
// Public, unauthenticated -- the sandbox demo prospective clients see
// before they've handed over any Facebook/Instagram access.
app.use(demoRouter);
// Public, unauthenticated -- self-serve signup and the login clients
// use to reach their own dashboard.
app.use(authRouter);

module.exports = app;
