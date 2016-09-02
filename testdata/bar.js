try {
  require('./foo').bar
  process.send('No error')
} catch (e) {
  process.send(e.stack.match(/^([^\n]*)\n/)[1])
}
