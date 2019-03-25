/**
 * With this message the observer tool gets informed about a new trial state.
 */
export interface IRequestChangeOfTrialStage {
  /** The unique identifier of the running Trial. */
  ostTrialId?: null | undefined | number;
  /** The sessionId for the running Trial. */
  ostTrialSessionId: number;
  /** The stageId of the stage that should be activated. */
  ostTrialStageId: number;
}
