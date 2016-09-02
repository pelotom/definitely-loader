import { assert, expect } from 'chai'
import webpack from 'webpack'
import { resolve, basename, dirname } from 'path'
import { fork } from 'child_process'
import { writeFileSync } from 'fs'
import tmp from 'tmp'

const itt = it
it = (description, compilerOptions, runCallback) => itt(description, testCallback => {

  testCallback = (cb => err => {
    cb(err)
    outFile.removeCallback()
  })(testCallback)

  const outFile = tmp.fileSync()

  webpack({
    target: 'node',
    output: {
      filename: basename(outFile.name),
      path: dirname(outFile.name)
    },
    ...compilerOptions()
  }, verifySuccess).run((err, stats) => {

    safely(() => {
      verifySuccess(err, stats)
    })

    fork(outFile.name).on('message', message => safely(() => {
      runCallback(message)
      testCallback()
    }))
  })

  function verifySuccess(err, stats) {
    expect(err).to.equal(null)
    assert(stats.toJson().errors.length === 0, stats.toJson().errors[0])
  }

  function safely(runnable) {
    try {
      runnable()
    } catch (e) {
      // Failure
      testCallback(e)
      outFile.removeCallback()
    }
  }
})

describe('accessing a nonexistent module export', () => {

  let file1, file2

  beforeEach(() => {
    file1 = makeTempJs(`
      module.exports = {
        foo: 'bar'
      }
    `)

    file2 = makeTempJs(`
      try {
        require('${file1.name}').bar
        process.send('No error')
      } catch (e) {
        process.send(e.stack.match(/^([^\\n]*)\\n/)[1])
      }
    `)
  })

  afterEach(() => {
    file1.removeCallback()
    file2.removeCallback()
  })

  it('works normally without definitely-loader', () => ({
    entry: file2.name,
  }), message => {
    expect(message).to.equal('No error')
  })

  it('fails with definitely-loader', () => ({
    entry: file2.name,
    module: { loaders: [{ test: /\.js$/, loader: resolve('./src/definitely-loader.js') }] }
  }), message => {
    expect(message).to.equal('Error: attempted to access nonexistent property `bar`')
  })
})

describe('non-object imports', () => {

  let file1, file2

  beforeEach(() => {
    file1 = makeTempJs(`
      module.exports = 3
    `)

    file2 = makeTempJs(`
      try {
        var foo = require('${file1.name}')
        process.send('No error')
      } catch (e) {
        process.send(e.stack.match(/^([^\\n]*)\\n/)[1])
      }
    `)
  })

  afterEach(() => {
    file1.removeCallback()
    file2.removeCallback()
  })

  it('are ignored by definitely-loader', () => ({
    entry: file2.name,
    module: { loaders: [{ test: /\.js$/, loader: resolve('./src/definitely-loader.js') }] }
  }), message => {
    expect(message).to.equal('No error')
  })
})

function makeTempJs(content) {
  const file = tmp.fileSync({ postfix: '.js' })
  writeFileSync(file.name, content)
  return file
}
