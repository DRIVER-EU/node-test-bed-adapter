export interface IValidator {
    /**
     * Returns true if all objects are valid.
     */
    isValid: (message: Object | Object[]) => boolean;
}
