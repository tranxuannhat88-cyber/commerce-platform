export interface StoreEditorCustomization {
  logo_url: string;
  cover_image_url: string;
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

export type PreviewDevice = "DESKTOP" | "MOBILE";