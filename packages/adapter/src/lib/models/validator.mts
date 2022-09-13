import { AvroMessage } from './avro-message.mjs';

export interface IValidator {
  /** Returns true if the messages are valid. */
  isValid: (message: AvroMessage[]) => boolean;
  isValidKey: <T>(key: T) => boolean;
}
