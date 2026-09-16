import {
  CoverPositionSettings,
  DeviceCoverSettings,
  CoverFitMode,
  DEFAULT_COVER_POSITION,
  DEFAULT_DEVICE_COVER_SETTINGS,
} from "@/types";

export type {
  CoverPositionSettings,
  DeviceCoverSettings,
  CoverFitMode,
};

export {
  DEFAULT_COVER_POSITION,
  DEFAULT_DEVICE_COVER_SETTINGS,
};

export interface StoreEditorCustomization {
  logo_url: string;
  cover_image_url: string;
  cover_position?: CoverPositionSettings;
  brand_color: string;
  accent_color: string;
  primary_cta_text: string;
  secondary_cta_text: string;
  visible_sections: {
    categories: boolean;
    featured_products: boolean;
    about: boolean;
    contact: boolean;
    reviews: boolean;
    policies?: boolean;
    offers?: boolean;
  };
  active_template_id: string;
  active_template_name: string;
  is_premium_template: boolean;
}

export type PreviewDevice = "DESKTOP" | "TABLET" | "MOBILE";