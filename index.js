const { buildClientSchema } = require('graphql/utilities')
const { getNamedType, Kind, GraphQLNonNull, GraphQLList, GraphQLObjectType, GraphQLInputObjectType } = require('graphql')

class ASTGenerator {
  constructor(schema) {
    this.schema = schema
  }

  // ==================================
  // AST node mapping
  // ==================================

  type(type) {
    if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
      return {
        kind: type instanceof GraphQLNonNull ? Kind.NON_NULL_TYPE : Kind.LIST_TYPE,
        type: this.type(type.ofType)
      }
    }
    return {
      kind: Kind.NAMED_TYPE,
      name: this.name(type)
    }
  }
  document(definitions) {
    return definitions.length > 0 ? { kind: Kind.DOCUMENT, definitions } : undefined
  }
  operation(operation, types) {
    types = !Array.isArray(types) ? [types] : types
    return {
      kind: Kind.OPERATION_DEFINITION,
      directives: [],
      name: undefined,
      operation,
      variableDefinitions: types.filter(type => type !== undefined).reduce((acc, { args }) => [...acc, ...args], []).map(arg => this.variableDefinition(arg)),
      selectionSet: this.selectionSet(types)
    }
  }
  variableDefinition(arg) {
    return {
      kind: Kind.VARIABLE_DEFINITION,
      defaultValue: undefined,
      directives: [],
      type: this.type(arg.type),
      variable: this.variable(arg)
    }
  }
  variable(type, name = undefined) {
    return {
      kind: Kind.VARIABLE,
      name: name || this.name(type)
    }
  }
  selectionSet(type) {
    return {
      kind: Kind.SELECTION_SET,
      selections: this.selections(type)
    }
  }
  selections(types) {
    return types.filter(type => type !== undefined).map(type => {
      const namedType = getNamedType(type.type)
      if (namedType instanceof GraphQLObjectType || namedType instanceof GraphQLInputObjectType) {
        return this.field(type, this.selectionSet(Object.values(namedType.getFields())))
      }
      return this.field(type)
    })
  }
  field(type, selectionSet = undefined) {
    return {
      kind: Kind.FIELD,
      alias: undefined,
      directives: [],
      arguments: (type.args || []).map(arg => this.argument(arg)),
      name: this.name(type),
      selectionSet
    }
  }
  argument(arg) {
    const name = this.name(arg)
    return {
      kind: Kind.ARGUMENT,
      name: this.name(arg),
      value: this.variable(arg, name)
    }
  }
  name({ name }) {
    return {
      kind: Kind.NAME,
      value: name
    }
  }

  // ==================================
  // Main types
  // ==================================

  resolve(type, names) {
    const { _queryType, _mutationType, _subscriptionType } = this.schema
    const mainType = { query: _queryType, mutation: _mutationType, subscription: _subscriptionType }[type]
    if (mainType) {
      const fields = mainType.getFields()
      const operationUndefinedFilter = operation => operation !== undefined && (Array.isArray(operation) ? operation.length > 0 : true)
      return this.document(names.map(name => Array.isArray(name) ? name.map(name => fields[name]).filter(operationUndefinedFilter) : fields[name])
        .filter(operationUndefinedFilter)
        .map(operation => this.operation(type, operation)))
    }
  }

  query(...names) {
    return this.resolve('query', names)
  }
  mutation(...names) {
    return this.resolve('mutation', names)
  }
  subscription(...names) {
    return this.resolve('subscription', names)
  }
}

module.exports = {
  fromIntrospection: /* istanbul ignore next */  (introspection, options) => module.exports.fromSchema(buildClientSchema(introspection, options)),
  fromSchema: schema => new ASTGenerator(schema)
}

