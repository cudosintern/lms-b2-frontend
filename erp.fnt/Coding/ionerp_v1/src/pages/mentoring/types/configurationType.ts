export interface ConfigurationType {
  id: number;
  config_type: string;
  min_mentees: number;
  max_mentees: number;
}

export interface SavePayload {
  config_type: string;
  min_mentees: number;
  max_mentees: number;
  config_type_id?: number;
}
