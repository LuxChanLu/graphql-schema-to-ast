# graphql-schema-to-ast

[![Build Status](https://travis-ci.org/YourSoftRun/graphql-schema-to-ast.svg?branch=master)](https://travis-ci.org/YourSoftRun/graphql-schema-to-ast)
[![Coverage Status](https://coveralls.io/repos/github/YourSoftRun/graphql-schema-to-ast/badge.svg?branch=master)](https://coveralls.io/github/YourSoftRun/graphql-schema-to-ast?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/38210938a9024e839d4a15a5d8104168)](https://www.codacy.com/app/Hugome/graphql-schema-to-ast?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=YourSoftRun/graphql-schema-to-ast&amp;utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/89cd336d9361d226f8b7/maintainability)](https://codeclimate.com/github/YourSoftRun/graphql-schema-to-ast/maintainability)
[![David](https://img.shields.io/david/YourSoftRun/graphql-schema-to-ast.svg)](https://david-dm.org/YourSoftRun/graphql-schema-to-ast)
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
