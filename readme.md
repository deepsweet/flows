# @flows

A proof of concept of alternative [Flow Library Definitions](https://flow.org/en/docs/libdefs/) manager. Strict "work in progress" state, I learn a lot about Flow.

1. Library Definitions ("libdefs") are published as standalone packages with independent versions – whenever target dependency got major version bump there should be a major bump of libdefs as well
2. Flow version doesn't matter – when it doesn't work with the latest one then it's a bug
3. Target dependency version is specified in libdefs `package.json` as peer depehdency
4. `flows` CLI modifies `[libs]` in `.flowconfig` with libdefs dev dependencies found across root package and/or Yarn workspaces instead of copying files into special folder

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

```diff
diff --git .flowconfig .flowconfig

+[libs]
+node_modules/@flows/one/src
+node_modules/@flows/two/src
+node_modules/@flows/three/src
```

^ Ruins comments and newlines between sections, have to write own `.flowconfig` parser/serializer<br/>
^ [flow/issues/5749](https://github.com/facebook/flow/issues/5749) +  [flow/issues/2364](https://github.com/facebook/flow/issues/2364) so only one `node_modules/@flows` line needs to be included to `[libs]`<br/>
^ [flow/issues/153](https://github.com/facebook/flow/issues/153) to get rid of custom (?) `.flowconfig` format in favor of JSON/YAML/TOML and/or field in `package.json`<br/>
^ [flow-typed/issues/1494](https://github.com/flowtype/flow-typed/issues/1494)?
