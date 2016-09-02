try {
  require('./foo').bar
  process.send(0)
} catch (e) {
  process.send(e.stack.match(/^([^\n]*)\n/)[1])
}
