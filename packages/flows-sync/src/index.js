#!/usr/bin/env node

/* eslint-disable no-process-exit */
/* eslint-disable promise/always-return */
import path from 'path'
import fs from 'graceful-fs'
import globby from 'globby'
import importCwd from 'import-cwd'
import resolveFrom from 'resolve-from'
import makethen from 'makethen'
import {
  ParseFlowConfig as parseFlowConfig,
  PrintFlowConfig as printFlowConfig,
} from 'flowconfig'

const FLOW_CONFIG = '.flowconfig'
const FLOWS_PREFIX = '@flows/'

const readFile = makethen(fs.readFile)
const writeFile = makethen(fs.writeFile)

const { workspaces: glob = [] } = importCwd('./package.json')
const globbyOptions = {
  absolute: true,
  deep: true,
  onlyFiles: false,
  expandDirectories: false,
  ignore: ['node_modules/**'],
}

globby(glob, globbyOptions)
  .then((dirs) =>
    dirs
      // add root package as well
      .concat(process.cwd())
      // get dev dependencies
      .map((dir) => ({
        dir,
        devDependencies: require(`${dir}/package.json`).devDependencies || {},
      }))
      // collect @flows packages from dev dependencies
      .map((pkg) => ({
        dir: pkg.dir,
        flows: Object.keys(pkg.devDependencies).filter((key) =>
          key.startsWith(FLOWS_PREFIX)
        ),
      }))
      // flatten result
      .reduce(
        (pkgs, next) =>
          pkgs.concat(
            next.flows
              // avoid duplicates
              .filter(
                (flow) => pkgs.findIndex((pkg) => flow === pkg.flow) === -1
              )
              .map((flow) => ({
                dir: next.dir,
                flow,
              }))
          ),
        []
      )
      // resolve @flows dependencies as from package dir
      .map((pkg) => resolveFrom(pkg.dir, pkg.flow))
      // get @flows dirs
      .map((flowFile) => path.dirname(flowFile))
      // make @flows dirs relative to root
      .map((flowDir) => path.relative(process.cwd(), flowDir))
  )
  .then((flows) =>
    readFile(FLOW_CONFIG, 'utf8')
      .then(parseFlowConfig)
      .then((flowConfig) => ({
        ...flowConfig,
        // filter out existing @flows and add new ones
        libs: flowConfig.libs
          ? flowConfig.libs
              .filter((lib) => !lib.includes(FLOWS_PREFIX))
              .concat(flows)
          : flows,
      }))
      .then(printFlowConfig)
      .then((flowConfig) => writeFile(FLOW_CONFIG, flowConfig, 'utf8'))
      .then(() => flows)
  )
  .then((flows) => {
    if (flows.length > 0) {
      console.log('The following @flows were linked to `.flowconfig`:')

      flows.forEach((flow) => console.log(flow))
    }
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
