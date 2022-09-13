/** Notification from GeoFencer when a rule matches the defined condition. */
export interface IGeoFencingEvent {
  /** The ID assigned in the geo fencer definition (GeoJSON) */
  RuleId: string;
  /** The GUID of the simulation entity for which the rule triggered. */
  SimItemEntityId: string;
  /**
   * The first time Hit is always true (the rule condition was matched), when false
   * the rule condition changed from true to false.
   */
  Hit: boolean;
  /** The rule was evaluated for the first time. */
  Initial: boolean;
  /** Timestamp when rule is created. */
  Timestamp: string;
}
