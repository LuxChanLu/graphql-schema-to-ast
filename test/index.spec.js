const { join } = require('path')
const { readFileSync } = require('fs')
const DeepDelete = require('deep-delete')
const { parse, graphqlSync, getIntrospectionQuery } = require('graphql')
const { buildSchema } = require('graphql/utilities')
const { fromSchema, fromIntrospection } = require('../index.js')

const schema = buildSchema(readFileSync(join(__dirname, '__fixture__', 'schema.gql')).toString())
const OutputType = '{ value string subtype { value float subsub { end } } }'

describe('schema to ast', () => {
  const operation = op => DeepDelete('loc', parse(op))
  const testResolver = resolver => {
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
      expect(resolver.subscription('somethingGonnaChange')).toEqual(operation(`subscription ($params: InputType!) { somethingGonnaChange(params: $params) ${OutputType} }`))
    })

    it('should not find basic subscription', () => {
      expect(resolver.subscription('subscribeToSomething')).toBeUndefined()
      expect(resolver.subscription(['subscribeToSomething'])).toBeUndefined()
    })
  }

  describe('- from a intropspection query result', () => testResolver(fromIntrospection(graphqlSync(schema, getIntrospectionQuery({ descriptions: false })).data)))
  describe('- from a schema class', () => testResolver(fromSchema(schema)))

  it('edge cases', () => {
    expect(fromSchema(buildSchema('type Query { returnNothing: Int }')).mutation('nop')).toBeUndefined()
    expect(fromSchema(buildSchema('type Query { returnNothing: Int }')).subscription('nop')).toBeUndefined()
  })
})
