import { assert, expect } from 'chai'
import webpack from 'webpack'
import { resolve } from 'path'
import { fork } from 'child_process'

const OUTPUT = 'test-output'

const itt = it
it = (description, compilerOptions, runCallback) => itt(description, testCallback => {

  webpack({
    target: 'node',
    output: {
      filename: OUTPUT
    },
    ...compilerOptions
  }, verifySuccess).run((err, stats) => {

    safely(() => {
      verifySuccess(err, stats)
    })

    fork(OUTPUT).on('message', message => safely(() => {
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
    }
  }
})

describe('accessing a nonexistent module export', () => {
  it('works normally without definitely-loader', {
    entry: './testdata/bar.js'
  }, message => {
    expect(message).to.equal(0)
  })

  it('fails with definitely-loader', {
    entry: './testdata/bar.js',
    module: { loaders: [{ test: /\.js$/, loader: resolve('./src/definitely-loader.js') }] }
  }, message => {
    expect(message).to.equal('Error: attempted to access nonexistent property `bar`')
  })
})
