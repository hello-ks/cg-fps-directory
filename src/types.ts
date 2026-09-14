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

export interface MappedCommodity {
  name: string;
  qty: number;
  unit?: string;
}

export interface MappedRationCard {
  rc_id: string;
  family_head?: string;
  scheme_short_name: string;
  scheme_id?: number;
  units?: number;
  commodities: MappedCommodity[];
  txn_id?: string;
  receipt_id?: string;
  amount?: number;
  trans_date?: string;
  trans_time?: string;
  source?: "live_epos" | "key_register" | "nominee";
}

export interface SchemeSummary {
  scheme_id: number;
  scheme_short_name: string;
  scheme_type: "N" | "S"; // NFSA or State
  cards: number;
  units: number;
}

export interface FpsKeyRegSummary {
  fps_id: string;
  del_name: string;
  dist_code: string;
  dist_name: string;
  afso_code: string;
  afso_name: string;
  total_cards: number;
  total_units: number;
  month: number;
  year: number;
  heading?: string;
  schemes: SchemeSummary[];
  mapped_cards_count: number;
  mapped_cards: MappedRationCard[];
  source_note?: string;
}

export interface KeyRegDistrict {
  dist_Code: string;
  dist_name_en: string;
  total_shops: number;
  total_cards: number;
  total_units: number;
  schemes?: SchemeSummary[];
}

export interface KeyRegAfso {
  dist_Code: string;
  afso_code: string;
  afso_name_en: string;
  total_shops: number;
  total_cards: number;
  total_units: number;
  schemes?: SchemeSummary[];
}
