const OmitDeep = require('omit-deep')
const { join } = require('path')
const { readFileSync } = require('fs')
const { buildSchema } = require('graphql/utilities')
const { parse } = require('graphql')
const { fromSchema, fromIntrospection } = require('../index.js')

const schema = buildSchema(readFileSync(join(__dirname, '__fixture__', 'schema.gql')).toString())
const OutputType = '{ value string subtype { value float subsub { end } } }'

describe('schema to ast', () => {
  const resolver = fromSchema(schema)
  const operation = op => OmitDeep(parse(op), 'loc')

  it('should find basic query', () => {
    expect(operation('query { simpleQuery }')).toEqual(resolver.query('simpleQuery'))
    expect(operation('query { simpleQueryMandatory }')).toEqual(resolver.query('simpleQueryMandatory'))
    expect(operation('query { arrayQueryMandatory }')).toEqual(resolver.query('arrayQueryMandatory'))
    expect(operation('query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) }')).toEqual(resolver.query('withParams'))
  })

  it('should find advanced query', () => {
    expect(operation('query { simpleQuery } query { simpleQueryMandatory }')).toEqual(resolver.query('simpleQuery', 'simpleQueryMandatory'))
    expect(operation('query { simpleQuery simpleQueryMandatory }')).toEqual(resolver.query(['simpleQuery', 'simpleQueryMandatory']))

    expect(operation('query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) } query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) }')).toEqual(resolver.query('withParams', 'withParams'))
    expect(operation('query ($param1: Int!, $param2: [Float]) { simpleQuery withParams(param1: $param1, param2: $param2) }')).toEqual(resolver.query(['simpleQuery', 'withParams']))
  })

  it('should find basic mutation', () => {
    expect(operation(`mutation ($params: InputType!) { doSomething(params: $params) ${OutputType} }`)).toEqual(resolver.mutation('doSomething'))
  })

  it('should find basic subscription', () => {
    expect(operation('subscription { subscribeToSomething }')).toEqual(resolver.subscription('subscribeToSomething'))
  })
})
