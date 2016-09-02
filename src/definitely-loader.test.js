import { assert, expect } from 'chai'
import webpack from 'webpack'
import { resolve, basename, dirname } from 'path'
import { fork } from 'child_process'
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
    ...compilerOptions
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
  it('works normally without definitely-loader', {
    entry: './testdata/bar.js'
  }, message => {
    expect(message).to.equal('No error')
  })

  it('fails with definitely-loader', {
    entry: './testdata/bar.js',
    module: { loaders: [{ test: /\.js$/, loader: resolve('./src/definitely-loader.js') }] }
  }, message => {
    expect(message).to.equal('Error: attempted to access nonexistent property `bar`')
  })
})
