const { TypeKind, Kind, graphqlSync, getIntrospectionQuery } = require('graphql')

const search = (arr, name) => (arr.find(item => (item.name === name)))

class ASTGenerator {
  constructor(introspection) {
    this._introspection = introspection
  }

  introspectType(name) {
    return search(this._introspection.__schema.types, name)
  }

  isWrappingType(type) {
    return [TypeKind.LIST, TypeKind.NON_NULL].indexOf(type.kind) !== -1
  }

  namedType(type) {
    return this.isWrappingType(type) ? this.namedType(type.ofType) : type
  }

  // ==================================
  // AST node mapping
  // ==================================

  type(type) {
    if (this.isWrappingType(type)) {
      return {
        kind: type.kind === TypeKind.NON_NULL ? Kind.NON_NULL_TYPE : Kind.LIST_TYPE,
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
      const namedType = this.namedType(type.type)
      if ([TypeKind.OBJECT, TypeKind.INPUT_OBJECT].indexOf(namedType.kind) !== -1) {
        return this.field(type, this.selectionSet(this.introspectType(namedType.name).fields))
      }
      return this.field(type)
    })
  }
  field(type, selectionSet = undefined) {
    return {
      kind: Kind.FIELD,
      alias: undefined,
      directives: [],
      arguments: type.args.map(arg => this.argument(arg)),
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
    const { queryType, mutationType, subscriptionType } = this._introspection.__schema
    const mainType = { query: queryType.name, mutation: (mutationType || {}).name, subscription: (subscriptionType || {}).name }[type]
    if (mainType) {
      const { fields } = this.introspectType(mainType)
      const operationUndefinedFilter = operation => operation !== undefined && (Array.isArray(operation) ? operation.length > 0 : true)
      return this.document(names.map(name => Array.isArray(name) ? name.map(name => search(fields, name)).filter(operationUndefinedFilter) : search(fields, name))
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
  fromIntrospection: introspection => new ASTGenerator(introspection),
  fromSchema: schema => module.exports.fromIntrospection(graphqlSync(schema, getIntrospectionQuery({ descriptions: false })).data)
}
