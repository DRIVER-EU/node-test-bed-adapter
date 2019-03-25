export enum TypeOfQuestion {
  slider = 'slider',
  checkbox = 'checkbox',
  radiobutton = 'radiobutton',
  text = 'text'
}

export interface IQuestion {
  /** The id of the question in OST database. */
  id: number;
  /** The question. */
  name: string;
  /** The additional clarifications shown below the question. */
  description: string;
  /**
   * The answer marked by the user (names of radio buttons, names of checkboxes,
   * value of slider or text).
   */
  answer: string;
  /** The comment provided by the user below the question. */
  comment: string;
  typeOfQuestion: TypeOfQuestion;
}

/**
 * This message represents one observation of one observer that was provided by
 * the app.
 */
export interface IObserverToolAnswer {
  /** The unique identifier of the running Trial. */
  trialId: number;
  /** The sessionId for the running Trial. */
  sessionId: number;
  /** The id of the answer in OST databased. */
  answerId: number;
  /**
   * The time when questionnaire was sent as the number of milliseconds from the
   * unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  timeSendUTC: number;
  /**
   * The time provided by user in the questionnaire (could be simulation time) was
   * sent as the number of milliseconds from the unix epoch, 1 January 1970
   * 00:00:00.000 UTC.
   */
  timeWhen: number;
  /** The name of the questionnaire. */
  observationTypeName: string;
  /** The id of the questionnaire in the OST database. */
  observervationTypeId: number;
  /** The description of the questionnaire. */
  observationTypeDescription: string;
  /**
   * The description provided by the user at the end of the questionnaire
   * (attachments section).
   */
  description: string;
  /**
   * The information if this questionnaire could be answered multiple times (you
   * could expect more than one answer from single user).
   */
  multiplicity: boolean;
  questions?: null | undefined | IQuestion | IQuestion[];
}
