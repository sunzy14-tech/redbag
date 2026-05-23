const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`redbag backend listening on :${env.port}`);
});

