export const AdminHeartbeatTopic = 'system_admin_heartbeat';
export const HeartbeatTopic = 'system_heartbeat';
export const LargeDataUpdateTopic = 'system_large_data_update';
export const MapLayerUpdateTopic = 'system_map_layer_update';
export const LogTopic = 'system_logging';
export const TimeTopic = 'simulation_time_mgmt';
export const TimeControlTopic = 'system_timing_control';
export const AccessInviteTopic = 'system_topic_access_invite';
export const CreateTopicRequestTopic = 'system_topic_create_request';
export const RemoveTopicRequestTopic = 'system_topic_remove_request';
export const AccessRemoveTopic = 'system_topic_remove';
export const TrialManagementPhaseMessageTopic = 'system_tm_phase_message';
export const TrialManagementRolePlayerTopic = 'system_tm_role_player';
export const TrialManagementSessionMgmtTopic = 'simulation_session_mgmt';
export const ObserverToolAnswer = 'system_observer_tool_answer';
export const RequestChangeOfTrialStage = 'system_request_change_of_trial_stage';

export const CoreSubscribeTopics = [TimeTopic, AccessInviteTopic];

export const CorePublishTopics = (usesLargeDataService = false) =>
  usesLargeDataService
    ? [HeartbeatTopic, LogTopic, LargeDataUpdateTopic]
    : [HeartbeatTopic, LogTopic];
