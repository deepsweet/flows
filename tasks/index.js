// @flow
import assert from 'assert'
import Task from '@start/task'
import Reporter from '@start/reporter'
import subTask from '@start/plugin-sub-task'
import env from '@start/plugin-env'
import find from '@start/plugin-find'
import findGitStaged from '@start/plugin-find-git-staged'
import clean from '@start/plugin-clean'
import read from '@start/plugin-read'
import babel from '@start/plugin-babel'
import write from '@start/plugin-write'
import overwrite from '@start/plugin-overwrite'
import watch from '@start/plugin-watch'
import eslint from '@start/plugin-eslint'
import prettierEslint from '@start/plugin-prettier-eslint'
import {
  istanbulInstrument,
  istanbulReport /*, istanbulThresholds */,
} from '@start/plugin-istanbul'
import tape from '@start/plugin-tape'
// import npmVersion from '@start/npm-version'
import npmPublish from '@start/plugin-npm-publish'
import tapDiff from 'tap-diff'

const reporter = Reporter()
const task = Task(reporter)

const babelConfig = {
  babelrc: false,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 6,
        },
        exclude: ['transform-regenerator'],
      },
    ],
    '@babel/preset-flow',
  ],
  plugins: ['@babel/plugin-proposal-object-rest-spread'],
}

export const build = (packageName: string) => {
  assert(packageName, 'Package name is required')

  return task(
    env('NODE_ENV', 'production'),
    find(`packages/${packageName}/build/`),
    clean,
    find(`packages/${packageName}/src/**/*.js`),
    read,
    babel(babelConfig),
    write(`packages/${packageName}/build/`)
  )
}

export const dev = (packageName: string) => {
  assert(packageName, 'Package name is required')

  return task(
    find(`packages/${packageName}/build/`),
    clean,
    watch(`packages/${packageName}/src/**/*.js`)(
      task(read, babel(babelConfig), write(`packages/${packageName}/build/`))
    )
  )
}

export const lint = () =>
  task(
    findGitStaged(['packages/*/{src|test}/**/*.js', 'tasks/**/*.js']),
    eslint()
  )

export const lintAll = () =>
  task(find(['packages/*/@(src|test)/**/*.js', 'tasks/**/*.js']), eslint())

export const fix = () =>
  task(
    find(['packages/*/@(src|test)/**/*.js', 'tasks/**/*.js']),
    read,
    prettierEslint(),
    overwrite
  )

export const test = () =>
  task(
    find('packages/*/src/**/*.js'),
    istanbulInstrument({ esModules: true }),
    find('packages/*/test/**/*.js'),
    tape(tapDiff),
    istanbulReport(['lcovonly', 'html', 'text-summary'])
    // istanbulThresholds({ functions: 70 })
  )

export const ci = () => task(subTask(lintAll)(), subTask(test)())

export const publish = (
  packageName: string,
  /* version: string, */ otp: string
) => {
  assert(packageName, 'Package name is required')
  // assert(version, 'Version is required')
  assert(otp, 'OTP is required')

  return task(
    subTask(lintAll)(),
    // subTask(ci)(),
    subTask(build)(packageName),
    // npmVersion(version, `packages/${packageName}`),
    npmPublish(`packages/${packageName}`, { otp })
  )
}
