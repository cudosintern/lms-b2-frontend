export interface ConfigurationType {
  config_type_id: number;
  config_type_name: string;
  min_mentees: number;
  max_mentees: number;
}

export interface SavePayload {
  config_type_name: string;
  min_mentees: number;
  max_mentees: number;
  config_type_id?: number;
}
