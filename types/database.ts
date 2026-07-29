export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string | null;
          industry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          display_name?: string | null;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          display_name?: string | null;
          industry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      data_delivery_methods: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      data_attributes: {
        Row: {
          id: string;
          name: string;
          public: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          public?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          public?: boolean;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          website_url: string | null;
          category: string | null;
          subcategory: string | null;
          delivery_method_ids: string[];
          data_attribute_ids: string[];
          claimed: boolean;
          is_active: boolean;
          claimed_contact: string | null;
          claimed_by_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          subcategory?: string | null;
          delivery_method_ids?: string[];
          data_attribute_ids?: string[];
          claimed?: boolean;
          is_active?: boolean;
          claimed_contact?: string | null;
          claimed_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          website_url?: string | null;
          category?: string | null;
          subcategory?: string | null;
          delivery_method_ids?: string[];
          data_attribute_ids?: string[];
          claimed?: boolean;
          is_active?: boolean;
          claimed_contact?: string | null;
          claimed_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "companies_claimed_by_user_id_fkey";
            columns: ["claimed_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      company_claim_tokens: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          email?: string;
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_claim_tokens_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_search_sessions: {
        Row: {
          id: string;
          created_at: string;
          topic: string | null;
          subject_population: string | null;
          years_dates: string | null;
          ownership: string | null;
          data_type: string | null;
          data_use: string | null;
          geography: string | null;
          other_details: string | null;
          raw_messages: unknown;
        };
        Insert: {
          id?: string;
          created_at?: string;
          topic?: string | null;
          subject_population?: string | null;
          years_dates?: string | null;
          ownership?: string | null;
          data_type?: string | null;
          data_use?: string | null;
          geography?: string | null;
          other_details?: string | null;
          raw_messages?: unknown;
        };
        Update: {
          id?: string;
          created_at?: string;
          topic?: string | null;
          subject_population?: string | null;
          years_dates?: string | null;
          ownership?: string | null;
          data_type?: string | null;
          data_use?: string | null;
          geography?: string | null;
          other_details?: string | null;
          raw_messages?: unknown;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          rating: number | null;
          title: string;
          body: string | null;
          ease_of_access_rating: number | null;
          sales_team_rating: number | null;
          data_coverage_rating: number | null;
          value_rating: number | null;
          found_when: string | null;
          result: string | null;
          hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          rating?: number | null;
          title: string;
          body?: string | null;
          ease_of_access_rating?: number | null;
          sales_team_rating?: number | null;
          data_coverage_rating?: number | null;
          value_rating?: number | null;
          found_when?: string | null;
          result?: string | null;
          hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          rating?: number | null;
          title?: string;
          body?: string | null;
          ease_of_access_rating?: number | null;
          sales_team_rating?: number | null;
          data_coverage_rating?: number | null;
          value_rating?: number | null;
          found_when?: string | null;
          result?: string | null;
          hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_bookmarks: {
        Row: {
          user_id: string;
          company_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          company_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          company_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_bookmarks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      external_api_clients: {
        Row: {
          id: string;
          name: string;
          key_sha256: string;
          key_prefix: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          key_sha256: string;
          key_prefix: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          key_sha256?: string;
          key_prefix?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      api_products: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          base_url: string | null;
          docs_url: string | null;
          auth_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          base_url?: string | null;
          docs_url?: string | null;
          auth_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          base_url?: string | null;
          docs_url?: string | null;
          auth_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_products_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      connection_requests: {
        Row: {
          id: string;
          company_id: string;
          source: string;
          requester_contact: string | null;
          requester_note: string | null;
          metadata: Json;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          source?: string;
          requester_contact?: string | null;
          requester_note?: string | null;
          metadata?: Json;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          source?: string;
          requester_contact?: string | null;
          requester_note?: string | null;
          metadata?: Json;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "connection_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      datasets: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          company_id: string | null;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          company_id?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          company_id?: string | null;
          source_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "datasets_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_connectivity_runs: {
        Row: {
          id: string;
          company_id: string;
          api_product_id: string | null;
          started_at: string;
          completed_at: string | null;
          status: string;
          agent_version: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          api_product_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          agent_version?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          api_product_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          agent_version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_connectivity_runs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_connectivity_runs_api_product_id_fkey";
            columns: ["api_product_id"];
            isOneToOne: false;
            referencedRelation: "api_products";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_connectivity_metrics: {
        Row: {
          id: string;
          run_id: string;
          metric_key: string;
          numeric_value: number | null;
          details: Json;
        };
        Insert: {
          id?: string;
          run_id: string;
          metric_key: string;
          numeric_value?: number | null;
          details?: Json;
        };
        Update: {
          id?: string;
          run_id?: string;
          metric_key?: string;
          numeric_value?: number | null;
          details?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "ai_connectivity_metrics_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "ai_connectivity_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_connectivity_scores: {
        Row: {
          id: string;
          company_id: string;
          api_product_id: string | null;
          score: number;
          methodology_version: string;
          computed_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          api_product_id?: string | null;
          score: number;
          methodology_version: string;
          computed_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          api_product_id?: string | null;
          score?: number;
          methodology_version?: string;
          computed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_connectivity_scores_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_connectivity_scores_api_product_id_fkey";
            columns: ["api_product_id"];
            isOneToOne: false;
            referencedRelation: "api_products";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          stripe_customer_id: string | null;
          billing_email: string | null;
          billing_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          stripe_customer_id?: string | null;
          billing_email?: string | null;
          billing_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          stripe_customer_id?: string | null;
          billing_email?: string | null;
          billing_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "developer" | "billing";
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "developer" | "billing";
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: "owner" | "developer" | "billing";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      org_api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_prefix: string;
          key_sha256: string;
          scopes: string[];
          revoked_at: string | null;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          key_prefix: string;
          key_sha256: string;
          scopes?: string[];
          revoked_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          key_prefix?: string;
          key_sha256?: string;
          scopes?: string[];
          revoked_at?: string | null;
          last_used_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_api_keys_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_listings: {
        Row: {
          id: string;
          slug: string;
          company_id: string;
          api_product_id: string | null;
          dataset_id: string | null;
          title: string;
          tagline: string | null;
          description: string | null;
          fulfillment_mode: "platform" | "vendor_direct";
          license_summary: string | null;
          license_version: string;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          company_id: string;
          api_product_id?: string | null;
          dataset_id?: string | null;
          title: string;
          tagline?: string | null;
          description?: string | null;
          fulfillment_mode?: "platform" | "vendor_direct";
          license_summary?: string | null;
          license_version?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          company_id?: string;
          api_product_id?: string | null;
          dataset_id?: string | null;
          title?: string;
          tagline?: string | null;
          description?: string | null;
          fulfillment_mode?: "platform" | "vendor_direct";
          license_summary?: string | null;
          license_version?: string;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_plans: {
        Row: {
          id: string;
          listing_id: string;
          name: string;
          price_cents: number;
          currency: string;
          interval: "month" | "year" | "one_time" | "usage" | "free" | null;
          trial_days: number;
          quota: Json;
          stripe_price_id: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          name: string;
          price_cents?: number;
          currency?: string;
          interval?: "month" | "year" | "one_time" | "usage" | "free" | null;
          trial_days?: number;
          quota?: Json;
          stripe_price_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          name?: string;
          price_cents?: number;
          currency?: string;
          interval?: "month" | "year" | "one_time" | "usage" | "free" | null;
          trial_days?: number;
          quota?: Json;
          stripe_price_id?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_plans_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_listings";
            referencedColumns: ["id"];
          },
        ];
      };
      marketplace_topics: {
        Row: {
          id: string;
          slug: string;
          label: string;
          description: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          label?: string;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      marketplace_listing_topics: {
        Row: {
          listing_id: string;
          topic_id: string;
          created_at: string;
        };
        Insert: {
          listing_id: string;
          topic_id: string;
          created_at?: string;
        };
        Update: {
          listing_id?: string;
          topic_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "marketplace_listing_topics_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marketplace_listing_topics_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_topics";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          stripe_checkout_session_id: string | null;
          status: "pending" | "active" | "past_due" | "canceled" | "incomplete";
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: "pending" | "active" | "past_due" | "canceled" | "incomplete";
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string | null;
          stripe_checkout_session_id?: string | null;
          status?: "pending" | "active" | "past_due" | "canceled" | "incomplete";
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      entitlements: {
        Row: {
          id: string;
          organization_id: string;
          listing_id: string;
          subscription_id: string | null;
          status: "pending_provisioning" | "active" | "suspended" | "revoked";
          license_accepted_at: string | null;
          license_version: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          listing_id: string;
          subscription_id?: string | null;
          status?: "pending_provisioning" | "active" | "suspended" | "revoked";
          license_accepted_at?: string | null;
          license_version?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          listing_id?: string;
          subscription_id?: string | null;
          status?: "pending_provisioning" | "active" | "suspended" | "revoked";
          license_accepted_at?: string | null;
          license_version?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entitlements_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "entitlements_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_listings";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_events: {
        Row: {
          id: string;
          organization_id: string;
          entitlement_id: string | null;
          api_key_id: string | null;
          units: number;
          event_type: string;
          metadata: Json;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          entitlement_id?: string | null;
          api_key_id?: string | null;
          units?: number;
          event_type?: string;
          metadata?: Json;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          entitlement_id?: string | null;
          api_key_id?: string | null;
          units?: number;
          event_type?: string;
          metadata?: Json;
          recorded_at?: string;
        };
        Relationships: [];
      };
      vendor_credentials: {
        Row: {
          id: string;
          api_product_id: string;
          environment: "sandbox" | "production";
          credential_type: string;
          encrypted_value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          api_product_id: string;
          environment?: "sandbox" | "production";
          credential_type?: string;
          encrypted_value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          api_product_id?: string;
          environment?: "sandbox" | "production";
          credential_type?: string;
          encrypted_value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          type: string;
          processed_at: string;
          payload: Json;
        };
        Insert: {
          id: string;
          type: string;
          processed_at?: string;
          payload?: Json;
        };
        Update: {
          id?: string;
          type?: string;
          processed_at?: string;
          payload?: Json;
        };
        Relationships: [];
      };
      vendor_interest_inquiries: {
        Row: {
          id: string;
          company_name: string;
          contact_email: string;
          contact_name: string | null;
          website_url: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_email: string;
          contact_name?: string | null;
          website_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_email?: string;
          contact_name?: string | null;
          website_url?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type DataDeliveryMethod = Database["public"]["Tables"]["data_delivery_methods"]["Row"];
export type DataAttribute = Database["public"]["Tables"]["data_attributes"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewWithCompany = Review & { companies: Pick<Company, "name" | "slug"> | null };
export type ReviewWithProfile = ReviewWithCompany & { profiles: Pick<Profile, "display_name" | "full_name"> | null };

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrgMember = Database["public"]["Tables"]["org_members"]["Row"];
export type OrgApiKey = Database["public"]["Tables"]["org_api_keys"]["Row"];
export type MarketplaceListing = Database["public"]["Tables"]["marketplace_listings"]["Row"];
export type MarketplaceTopic = Database["public"]["Tables"]["marketplace_topics"]["Row"];
export type MarketplacePlan = Database["public"]["Tables"]["marketplace_plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Entitlement = Database["public"]["Tables"]["entitlements"]["Row"];
export type UsageEvent = Database["public"]["Tables"]["usage_events"]["Row"];
