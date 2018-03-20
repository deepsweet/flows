# @flows

A proof of concept of alternative [Flow Library Definitions](https://flow.org/en/docs/libdefs/) manager. Strict "work in progress" state, I learn a lot about Flow.

* Library Definitions ("libdefs") has a standalone version – whenever target dependency got major version bump there should be a major bump of libdefs as well
* Flow version doesn't matter – when it doesn't work with the latest one then it's a bug
* Target dependency version is specified in libdefs `package.json` as peer depehdency

## How to

```
packages
├── foo/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── readme.md
├── bar/
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── readme.md
└── package.json
```

```sh
$ yarn add --dev flows-sync
```

```json
{
  "scripts": {
    "postinstall": "flows"
  }
}
```

```sh
$ yarn add --dev --ignore-workspace-root-check @flows/one
$ yarn add --dev --cwd packages/foo @flows/two
$ yarn add --dev --cwd packages/bar @flows/three
```

^ "Libdefs" to choose from are stored in [packages/lib/](packages/lib)

```sh
$ yarn flows
```

^ [yarn/issues/3911](https://github.com/yarnpkg/yarn/issues/3911)

```diff
diff --git .flowconfig .flowconfig

+[libs]
+node_modules/@flows/one/src
+node_modules/@flows/two/src
+node_modules/@flows/three/src
```

^ Ruins comments and newlines between sections, have to write own `.flowconfig` parser/serializer<br/>
^ [flow/issues/5749](https://github.com/facebook/flow/issues/5749) +  [flow/issues/2364](https://github.com/facebook/flow/issues/2364) so only one `node_modules/@flows` line is needed to be included to `[libs]`<br/>
^ [flow/issues/153](https://github.com/facebook/flow/issues/153) to get rid of custom (?) `.flowconfig` format in favor of JSON/YAML/TOML and/or field in `package.json`
