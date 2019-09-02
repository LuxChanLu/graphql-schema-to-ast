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
    expect(resolver.query('simpleQuery')).toEqual(operation('query { simpleQuery }'))
    expect(resolver.query('simpleQueryMandatory')).toEqual(operation('query { simpleQueryMandatory }'))
    expect(resolver.query('arrayQueryMandatory')).toEqual(operation('query { arrayQueryMandatory }'))
    expect(resolver.query('withParams')).toEqual(operation('query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) }'))
  })

  it('should not find query', () => {
    expect(resolver.query('nonExistingQuery')).toBeUndefined()
  })

  it('should find advanced query', () => {
    expect(resolver.query('simpleQuery', 'simpleQueryMandatory')).toEqual(operation('query { simpleQuery } query { simpleQueryMandatory }'))
    expect(resolver.query(['simpleQuery', 'simpleQueryMandatory'])).toEqual(operation('query { simpleQuery simpleQueryMandatory }'))

    expect(resolver.query('withParams', 'withParams')).toEqual(operation('query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) } query ($param1: Int!, $param2: [Float]) { withParams(param1: $param1, param2: $param2) }'))
    expect(resolver.query(['simpleQuery', 'withParams'])).toEqual(operation('query ($param1: Int!, $param2: [Float]) { simpleQuery withParams(param1: $param1, param2: $param2) }'))
  })

  it('should find basic mutation', () => {
    expect(resolver.mutation('doSomething')).toEqual(operation(`mutation ($params: InputType!) { doSomething(params: $params) ${OutputType} }`))
  })

  it('should find basic subscription', () => {
    expect(resolver.subscription('subscribeToSomething')).toEqual(operation('subscription { subscribeToSomething }'))
  })
})
