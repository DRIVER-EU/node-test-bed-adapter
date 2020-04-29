export interface IValidator {
  /**
   * Returns true if all objects are valid.
   */
  isValid: (message: Object | Object[]) => boolean;
  /** Returns true if the key is valid */
  isKeyValid: (key: Object | string | number | undefined) => boolean;
}
