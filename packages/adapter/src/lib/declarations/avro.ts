import { Type } from 'avsc';

export interface ISchemaOptions {
  /**
   * The Avro specification mandates that we fall through to the underlying type if a logical type is invalid.
   * When set, this option will override this behavior and throw an error when a logical type can't be applied.
   */
  assertLogicalTypes?: boolean;
  /**
   * Optional dictionary of LogicalType.
   * This can be used to support serialization and deserialization of arbitrary native objects.
   */
  logicalTypes?: Object;
  /**
   * Optional parent namespace.
   */
  namespace?: string;
  /**
   * Throw an error if a named type (enum, fixed, record, or error) is missing its name field.
   * By default anonymous types are supported; they behave exactly like their named equivalent
   * except that they cannot be referenced, can be resolved by any compatible type, and use the
   * type's typeName as union branch.
   */
  noAnonymousTypes?: boolean;
  /**
   * Registry of predefined type names. This can for example be used to override the types used
   * for primitives or to split a schema declaration over multiple files.
   */
  registry?: Object;
  /**
   * Function called before each type declaration or reference is parsed.
   * The relevant decoded schema is available as first argument and the parsing options as second. This function
   * can optionally return a type which will then be used in place of the result of parsing schema. Using this
   * option, it is possible to customize the parsing process by intercepting the creation of any type.
   */
  typeHook?: (schema: string, opts: ISchemaOptions) => any;
  /**
   * Control whether unions should be represented using a WrappedUnionType or an UnwrappedUnionType.
   * By default, the "natural" unwrapped alternative will be used if possible, falling back to wrapping
   * if the former would lead to ambiguities. Possible values for this option are: 'auto' (the default);
   * 'always' or true (always wrap unions); 'never' or false (never wrap unions, an error will be thrown
   * if an ambiguous union is parsed in this case).
   */
  wrapUnions?: boolean | 'auto' | 'never' | 'always';
}

export interface IForTypesOptions extends ISchemaOptions {
  strictDefaults?: boolean;
}

export interface IForValueOptions extends IForTypesOptions {
  /**
   * Temporary type used when an empty array is encountered.
   * It will be discarded as soon as the array's type can be inferred. Defaults to null's type.
   */
  emptyArrayType?: Type;
  /**
   * Function called each time a type needs to be inferred from a value. This function should either
   * return an alternate type to use, or undefined to proceed with the default inference logic.
   */
  valueHook: (val: any, opts: IForValueOptions) => any;
}

export interface IValidationOptions {
  /**
   * Function called when an invalid value is encountered.
   * When an invalid value causes its parent values to also be invalid, the latter do not trigger a callback.
   * path will be an array of strings identifying where the mismatch occurred.
   * This option is especially useful when dealing with complex records.
   */
  errorHook?: (path: string[], anything: any, type: Type) => void;
  /**
   * When set, records with attributes that don't correspond to a declared field will be considered invalid.
   * The default is to ignore any extra attributes.
   */
  noUndeclaredFields?: boolean;
}

export interface IAvroDecoded { value: any; offset: number; }


export interface IAvroSchema extends Type {
  branchName: string;
  doc: string;
  name: string;
  aliases: string[];
  types: Type[];
}
