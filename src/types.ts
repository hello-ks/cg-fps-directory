export interface FpsItem {
  fps_code: string;
  fps_name: string;
  raw_label?: string;
  district_code?: string;
  district_name?: string;
  sub_district_code?: string;
  sub_district_name?: string;
}

export interface SubDistrict {
  sub_district_code: string;
  sub_district_name: string;
  fps_list: FpsItem[];
}

export interface District {
  district_code: string;
  district_name: string;
  sub_districts: SubDistrict[];
}

export interface DirectorySummary {
  total_districts: number;
  total_sub_districts: number;
  total_fps: number;
  last_updated: string;
  source_url: string;
}

export interface FlatFpsRecord {
  district_code: string;
  district_name: string;
  sub_district_code: string;
  sub_district_name: string;
  fps_code: string;
  fps_name: string;
}
