export type Artifact = {
  namespace: string;
  htmlfile: string;
  icon: string;
  variant: number;
  mobile_variant: number;
  color: string;
  description: string;
  created_at: number;
};

export type StoredValue = {
  namespace: string;
  key: string;
  value: string;
  updated_at: number;
};

export type ArtifactTheme = {
  icon: string;
  variant: number;
  mobile_variant: number;
  color: string;
  description: string;
};
