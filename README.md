# graphql-schema-to-ast

[![Build](https://github.com/LuxChanLu/graphql-schema-to-ast/actions/workflows/build.yaml/badge.svg)](https://github.com/LuxChanLu/graphql-schema-to-ast/actions/workflows/build.yaml)
[![Coverage Status](https://coveralls.io/repos/github/LuxChanLu/graphql-schema-to-ast/badge.svg?branch=master)](https://coveralls.io/github/LuxChanLu/graphql-schema-to-ast?branch=master)
[![Downloads](https://img.shields.io/npm/dm/graphql-schema-to-ast.svg)](https://www.npmjs.com/package/graphql-schema-to-ast)

## How to use it

This library generate an AST Document with a schema and a query name
Simple way :
It generate a graphql query/mutation/subscrition from a schema with only the name of the operation (Yes it will include query all fields)

```js
const GQLSchemaToAst = require('graphql-schema-to-ast')

const generatorFromInstrospectionResult = GQLSchemaToAst.fromIntrospection(introspectionQueryResult, optionalBuildClientSchemaOption)
const generatorFromSchema = GQLSchemaToAst.fromSchema(grapqhlSchema)

generatorFromInstrospectionResult.query('queryOne')
generatorFromInstrospectionResult.query('queryOne', 'queryTwo')
generatorFromSchema.query(['queryOne', 'queryTwo'])

generatorFromSchema.mutation('mutationOne')
generatorFromSchema.subscription('subscriptionOne')
```
