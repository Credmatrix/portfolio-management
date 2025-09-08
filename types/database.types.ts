export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_archived: boolean | null
          metadata: Json | null
          request_id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          request_id: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          request_id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "ai_chat_conversations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          context_data: Json | null
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          model_used: string | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          context_data?: Json | null
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          context_data?: Json | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          model_used?: string | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_usage: {
        Row: {
          conversation_id: string
          cost_usd: number | null
          created_at: string | null
          id: string
          model_used: string
          tokens_input: number
          tokens_output: number
          user_id: string
        }
        Insert: {
          conversation_id: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used: string
          tokens_input?: number
          tokens_output?: number
          user_id: string
        }
        Update: {
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          model_used?: string
          tokens_input?: number
          tokens_output?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_usage_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_cache: {
        Row: {
          analysis_level: string
          analysis_result: Json
          analysis_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          request_id: string
          updated_at: string | null
        }
        Insert: {
          analysis_level?: string
          analysis_result: Json
          analysis_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_id: string
          updated_at?: string | null
        }
        Update: {
          analysis_level?: string
          analysis_result?: Json
          analysis_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          request_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_cache_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_cache_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_cache_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_details: {
        Row: {
          analysis_data: Json
          analysis_type: string
          created_at: string | null
          id: string
          request_id: string | null
        }
        Insert: {
          analysis_data: Json
          analysis_type: string
          created_at?: string | null
          id?: string
          request_id?: string | null
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          created_at?: string | null
          id?: string
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_details_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_details_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_details_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          base_data: Json | null
          base_data_cached_at: string | null
          cache_ttl_hours: number | null
          cin: string | null
          comprehensive_data: Json | null
          comprehensive_data_cached_at: string | null
          created_at: string | null
          data_status: Json | null
          id: string
          is_stale: boolean | null
          legal_name: string | null
          pan: string | null
          probe42_doc_version: string | null
          probe42_efiling_status: string | null
          probe42_last_base_updated: string | null
          probe42_last_details_updated: string | null
          probe42_last_fin_year_end: string | null
          status_cached_at: string | null
          updated_at: string | null
        }
        Insert: {
          base_data?: Json | null
          base_data_cached_at?: string | null
          cache_ttl_hours?: number | null
          cin?: string | null
          comprehensive_data?: Json | null
          comprehensive_data_cached_at?: string | null
          created_at?: string | null
          data_status?: Json | null
          id?: string
          is_stale?: boolean | null
          legal_name?: string | null
          pan?: string | null
          probe42_doc_version?: string | null
          probe42_efiling_status?: string | null
          probe42_last_base_updated?: string | null
          probe42_last_details_updated?: string | null
          probe42_last_fin_year_end?: string | null
          status_cached_at?: string | null
          updated_at?: string | null
        }
        Update: {
          base_data?: Json | null
          base_data_cached_at?: string | null
          cache_ttl_hours?: number | null
          cin?: string | null
          comprehensive_data?: Json | null
          comprehensive_data_cached_at?: string | null
          created_at?: string | null
          data_status?: Json | null
          id?: string
          is_stale?: boolean | null
          legal_name?: string | null
          pan?: string | null
          probe42_doc_version?: string | null
          probe42_efiling_status?: string | null
          probe42_last_base_updated?: string | null
          probe42_last_details_updated?: string | null
          probe42_last_fin_year_end?: string | null
          status_cached_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_management: {
        Row: {
          actual_credit_limit_approved: number | null
          ad_hoc_limit: number | null
          ar_remarks: string | null
          ar_values: number | null
          case_notes: string | null
          collection_feedback: string | null
          collection_remarks: string | null
          created_at: string | null
          created_by: string | null
          dpd_behavior: string | null
          dpd_remarks: string | null
          general_remarks: string | null
          id: string
          insurance_cover: number | null
          insurance_remarks: string | null
          limit_validity_date: string | null
          payment_terms: string | null
          request_id: string
          security_requirements: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_credit_limit_approved?: number | null
          ad_hoc_limit?: number | null
          ar_remarks?: string | null
          ar_values?: number | null
          case_notes?: string | null
          collection_feedback?: string | null
          collection_remarks?: string | null
          created_at?: string | null
          created_by?: string | null
          dpd_behavior?: string | null
          dpd_remarks?: string | null
          general_remarks?: string | null
          id?: string
          insurance_cover?: number | null
          insurance_remarks?: string | null
          limit_validity_date?: string | null
          payment_terms?: string | null
          request_id: string
          security_requirements?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_credit_limit_approved?: number | null
          ad_hoc_limit?: number | null
          ar_remarks?: string | null
          ar_values?: number | null
          case_notes?: string | null
          collection_feedback?: string | null
          collection_remarks?: string | null
          created_at?: string | null
          created_by?: string | null
          dpd_behavior?: string | null
          dpd_remarks?: string | null
          general_remarks?: string | null
          id?: string
          insurance_cover?: number | null
          insurance_remarks?: string | null
          limit_validity_date?: string | null
          payment_terms?: string | null
          request_id?: string
          security_requirements?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_management_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "credit_management_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      document_processing_requests: {
        Row: {
          available_parameters: number | null
          banking_parameters: number | null
          business_parameters: number | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          extracted_data: Json | null
          file_extension: string
          file_size: number | null
          financial_parameters: number | null
          hygiene_parameters: number | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          model_type: Database["public"]["Enums"]["model_type"] | null
          organization_id: string | null
          original_filename: string
          pdf_file_size: number | null
          pdf_filename: string | null
          pdf_s3_key: string | null
          processing_started_at: string | null
          processing_summary: Json | null
          recommended_limit: number | null
          request_id: string
          retry_count: number | null
          risk_analysis: Json | null
          risk_grade: string | null
          risk_score: number | null
          s3_folder_path: string
          s3_upload_key: string
          status: Database["public"]["Enums"]["processing_status"] | null
          submitted_at: string | null
          total_parameters: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          available_parameters?: number | null
          banking_parameters?: number | null
          business_parameters?: number | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_extension: string
          file_size?: number | null
          financial_parameters?: number | null
          hygiene_parameters?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          model_type?: Database["public"]["Enums"]["model_type"] | null
          organization_id?: string | null
          original_filename: string
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_s3_key?: string | null
          processing_started_at?: string | null
          processing_summary?: Json | null
          recommended_limit?: number | null
          request_id: string
          retry_count?: number | null
          risk_analysis?: Json | null
          risk_grade?: string | null
          risk_score?: number | null
          s3_folder_path: string
          s3_upload_key: string
          status?: Database["public"]["Enums"]["processing_status"] | null
          submitted_at?: string | null
          total_parameters?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          available_parameters?: number | null
          banking_parameters?: number | null
          business_parameters?: number | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_extension?: string
          file_size?: number | null
          financial_parameters?: number | null
          hygiene_parameters?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          model_type?: Database["public"]["Enums"]["model_type"] | null
          organization_id?: string | null
          original_filename?: string
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_s3_key?: string | null
          processing_started_at?: string | null
          processing_summary?: Json | null
          recommended_limit?: number | null
          request_id?: string
          retry_count?: number | null
          risk_analysis?: Json | null
          risk_grade?: string | null
          risk_score?: number | null
          s3_folder_path?: string
          s3_upload_key?: string
          status?: Database["public"]["Enums"]["processing_status"] | null
          submitted_at?: string | null
          total_parameters?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      downloads: {
        Row: {
          download_type: string
          downloaded_at: string | null
          id: string
          ip_address: unknown | null
          request_id: string
          user_agent: string | null
        }
        Insert: {
          download_type: string
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown | null
          request_id: string
          user_agent?: string | null
        }
        Update: {
          download_type?: string
          downloaded_at?: string | null
          id?: string
          ip_address?: unknown | null
          request_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downloads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          original_name: string
          request_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size: number
          filename: string
          id?: string
          original_name: string
          request_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          original_name?: string
          request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "analysis_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "request_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      mca_master_data: {
        Row: {
          authorized_capital: number | null
          cin: string
          company_category: string | null
          company_class: string | null
          company_name: string
          company_roc_code: string | null
          company_state_code: string | null
          company_status: string | null
          company_sub_category: string | null
          company_type: string | null
          created_at: string | null
          data_fetched_at: string | null
          id: number
          industrial_classification: string | null
          listing_status: string | null
          nic_code: string | null
          paidup_capital: number | null
          registered_office_address: string | null
          registration_date: string | null
          updated_at: string | null
        }
        Insert: {
          authorized_capital?: number | null
          cin: string
          company_category?: string | null
          company_class?: string | null
          company_name: string
          company_roc_code?: string | null
          company_state_code?: string | null
          company_status?: string | null
          company_sub_category?: string | null
          company_type?: string | null
          created_at?: string | null
          data_fetched_at?: string | null
          id?: number
          industrial_classification?: string | null
          listing_status?: string | null
          nic_code?: string | null
          paidup_capital?: number | null
          registered_office_address?: string | null
          registration_date?: string | null
          updated_at?: string | null
        }
        Update: {
          authorized_capital?: number | null
          cin?: string
          company_category?: string | null
          company_class?: string | null
          company_name?: string
          company_roc_code?: string | null
          company_state_code?: string | null
          company_status?: string | null
          company_sub_category?: string | null
          company_type?: string | null
          created_at?: string | null
          data_fetched_at?: string | null
          id?: number
          industrial_classification?: string | null
          listing_status?: string | null
          nic_code?: string | null
          paidup_capital?: number | null
          registered_office_address?: string | null
          registration_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mca_sync_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_offset: number | null
          error_message: string | null
          fetched_records: number | null
          id: number
          started_at: string | null
          sync_status: string | null
          total_records: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_offset?: number | null
          error_message?: string | null
          fetched_records?: number | null
          id?: number
          started_at?: string | null
          sync_status?: string | null
          total_records?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_offset?: number | null
          error_message?: string | null
          fetched_records?: number | null
          id?: number
          started_at?: string | null
          sync_status?: string | null
          total_records?: number | null
        }
        Relationships: []
      }
      portfolio_analytics: {
        Row: {
          about_the_company: string | null
          active_compliance: string | null
          audit_qualification_status: string | null
          authorised_capital_cr: number | null
          banking_count: number | null
          banking_max_score: number | null
          banking_percentage: number | null
          banking_score: number | null
          banking_total: number | null
          base_eligibility: number | null
          broad_industry_category: string | null
          business_address_line_1: string | null
          business_address_line_2: string | null
          business_city: string | null
          business_count: number | null
          business_max_score: number | null
          business_percentage: number | null
          business_pin_code: string | null
          business_score: number | null
          business_state: string | null
          business_total: number | null
          cin: string | null
          company_name: string | null
          company_status: string | null
          completed_at: string | null
          constitution_entity_benchmark: string | null
          constitution_entity_score: number | null
          constitution_entity_value: string | null
          created_at: string | null
          creditors_days_benchmark: string | null
          creditors_days_score: number | null
          creditors_days_value: number | null
          current_assets: number | null
          current_liabilities: number | null
          current_ratio_benchmark: string | null
          current_ratio_score: number | null
          current_ratio_value: number | null
          date_of_incorporation: string | null
          date_of_last_agm: string | null
          debt_equity_benchmark: string | null
          debt_equity_score: number | null
          debt_equity_value: number | null
          debtors_days_benchmark: string | null
          debtors_days_score: number | null
          debtors_days_value: number | null
          diversion_funds_benchmark: string | null
          diversion_funds_score: number | null
          diversion_funds_value: number | null
          ebitda: number | null
          ebitda_margin_benchmark: string | null
          ebitda_margin_score: number | null
          ebitda_margin_value: number | null
          email: string | null
          epfo_compliance_status: string | null
          epfo_establishment_count: number | null
          final_eligibility: number | null
          finance_cost_benchmark: string | null
          finance_cost_score: number | null
          finance_cost_value: number | null
          financial_count: number | null
          financial_max_score: number | null
          financial_percentage: number | null
          financial_score: number | null
          financial_total: number | null
          gst_active_count: number | null
          gst_compliance_benchmark: string | null
          gst_compliance_score: number | null
          gst_compliance_status: string | null
          gst_compliance_value: string | null
          hygiene_count: number | null
          hygiene_max_score: number | null
          hygiene_percentage: number | null
          hygiene_score: number | null
          hygiene_total: number | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          interest_coverage_benchmark: string | null
          interest_coverage_score: number | null
          interest_coverage_value: number | null
          inventory_days_benchmark: string | null
          inventory_days_score: number | null
          inventory_days_value: number | null
          legal_name: string | null
          lei: string | null
          listing_status: string | null
          long_term_borrowings: number | null
          model_id: string | null
          model_type: Database["public"]["Enums"]["model_type"] | null
          ncatd_benchmark: string | null
          ncatd_score: number | null
          ncatd_value: number | null
          net_profit: number | null
          net_worth_cr: number | null
          overall_percentage: number | null
          paid_up_capital_cr: number | null
          pan: string | null
          pat_benchmark: string | null
          pat_score: number | null
          pat_value: number | null
          pf_compliance_benchmark: string | null
          pf_compliance_score: number | null
          pf_compliance_value: string | null
          phone: string | null
          primary_banker_benchmark: string | null
          primary_banker_score: number | null
          primary_banker_value: string | null
          processing_status:
            | Database["public"]["Enums"]["processing_status"]
            | null
          quick_ratio_benchmark: string | null
          quick_ratio_score: number | null
          quick_ratio_value: number | null
          rating_type_benchmark: string | null
          rating_type_score: number | null
          rating_type_value: string | null
          recent_charges_benchmark: string | null
          recent_charges_score: number | null
          recent_charges_value: string | null
          recommended_limit: number | null
          region: string | null
          registered_address_line_1: string | null
          registered_address_line_2: string | null
          registered_city: string | null
          registered_pin_code: string | null
          registered_state: string | null
          request_id: string
          revenue: number | null
          risk_category: number | null
          risk_grade: string | null
          risk_multiplier: number | null
          risk_score: number | null
          roce_benchmark: string | null
          roce_score: number | null
          roce_value: number | null
          sales_trend_benchmark: string | null
          sales_trend_score: number | null
          sales_trend_value: string | null
          segment: string | null
          short_term_borrowings: number | null
          state: string | null
          sum_of_charges_cr: number | null
          tol_tnw_benchmark: string | null
          tol_tnw_score: number | null
          tol_tnw_value: number | null
          total_assets: number | null
          total_equity: number | null
          turnover_cr: number | null
          type_of_entity: string | null
          updated_at: string | null
          vintage_benchmark: string | null
          vintage_score: number | null
          vintage_value: string | null
          website: string | null
        }
        Insert: {
          about_the_company?: string | null
          active_compliance?: string | null
          audit_qualification_status?: string | null
          authorised_capital_cr?: number | null
          banking_count?: number | null
          banking_max_score?: number | null
          banking_percentage?: number | null
          banking_score?: number | null
          banking_total?: number | null
          base_eligibility?: number | null
          broad_industry_category?: string | null
          business_address_line_1?: string | null
          business_address_line_2?: string | null
          business_city?: string | null
          business_count?: number | null
          business_max_score?: number | null
          business_percentage?: number | null
          business_pin_code?: string | null
          business_score?: number | null
          business_state?: string | null
          business_total?: number | null
          cin?: string | null
          company_name?: string | null
          company_status?: string | null
          completed_at?: string | null
          constitution_entity_benchmark?: string | null
          constitution_entity_score?: number | null
          constitution_entity_value?: string | null
          created_at?: string | null
          creditors_days_benchmark?: string | null
          creditors_days_score?: number | null
          creditors_days_value?: number | null
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio_benchmark?: string | null
          current_ratio_score?: number | null
          current_ratio_value?: number | null
          date_of_incorporation?: string | null
          date_of_last_agm?: string | null
          debt_equity_benchmark?: string | null
          debt_equity_score?: number | null
          debt_equity_value?: number | null
          debtors_days_benchmark?: string | null
          debtors_days_score?: number | null
          debtors_days_value?: number | null
          diversion_funds_benchmark?: string | null
          diversion_funds_score?: number | null
          diversion_funds_value?: number | null
          ebitda?: number | null
          ebitda_margin_benchmark?: string | null
          ebitda_margin_score?: number | null
          ebitda_margin_value?: number | null
          email?: string | null
          epfo_compliance_status?: string | null
          epfo_establishment_count?: number | null
          final_eligibility?: number | null
          finance_cost_benchmark?: string | null
          finance_cost_score?: number | null
          finance_cost_value?: number | null
          financial_count?: number | null
          financial_max_score?: number | null
          financial_percentage?: number | null
          financial_score?: number | null
          financial_total?: number | null
          gst_active_count?: number | null
          gst_compliance_benchmark?: string | null
          gst_compliance_score?: number | null
          gst_compliance_status?: string | null
          gst_compliance_value?: string | null
          hygiene_count?: number | null
          hygiene_max_score?: number | null
          hygiene_percentage?: number | null
          hygiene_score?: number | null
          hygiene_total?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          interest_coverage_benchmark?: string | null
          interest_coverage_score?: number | null
          interest_coverage_value?: number | null
          inventory_days_benchmark?: string | null
          inventory_days_score?: number | null
          inventory_days_value?: number | null
          legal_name?: string | null
          lei?: string | null
          listing_status?: string | null
          long_term_borrowings?: number | null
          model_id?: string | null
          model_type?: Database["public"]["Enums"]["model_type"] | null
          ncatd_benchmark?: string | null
          ncatd_score?: number | null
          ncatd_value?: number | null
          net_profit?: number | null
          net_worth_cr?: number | null
          overall_percentage?: number | null
          paid_up_capital_cr?: number | null
          pan?: string | null
          pat_benchmark?: string | null
          pat_score?: number | null
          pat_value?: number | null
          pf_compliance_benchmark?: string | null
          pf_compliance_score?: number | null
          pf_compliance_value?: string | null
          phone?: string | null
          primary_banker_benchmark?: string | null
          primary_banker_score?: number | null
          primary_banker_value?: string | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          quick_ratio_benchmark?: string | null
          quick_ratio_score?: number | null
          quick_ratio_value?: number | null
          rating_type_benchmark?: string | null
          rating_type_score?: number | null
          rating_type_value?: string | null
          recent_charges_benchmark?: string | null
          recent_charges_score?: number | null
          recent_charges_value?: string | null
          recommended_limit?: number | null
          region?: string | null
          registered_address_line_1?: string | null
          registered_address_line_2?: string | null
          registered_city?: string | null
          registered_pin_code?: string | null
          registered_state?: string | null
          request_id: string
          revenue?: number | null
          risk_category?: number | null
          risk_grade?: string | null
          risk_multiplier?: number | null
          risk_score?: number | null
          roce_benchmark?: string | null
          roce_score?: number | null
          roce_value?: number | null
          sales_trend_benchmark?: string | null
          sales_trend_score?: number | null
          sales_trend_value?: string | null
          segment?: string | null
          short_term_borrowings?: number | null
          state?: string | null
          sum_of_charges_cr?: number | null
          tol_tnw_benchmark?: string | null
          tol_tnw_score?: number | null
          tol_tnw_value?: number | null
          total_assets?: number | null
          total_equity?: number | null
          turnover_cr?: number | null
          type_of_entity?: string | null
          updated_at?: string | null
          vintage_benchmark?: string | null
          vintage_score?: number | null
          vintage_value?: string | null
          website?: string | null
        }
        Update: {
          about_the_company?: string | null
          active_compliance?: string | null
          audit_qualification_status?: string | null
          authorised_capital_cr?: number | null
          banking_count?: number | null
          banking_max_score?: number | null
          banking_percentage?: number | null
          banking_score?: number | null
          banking_total?: number | null
          base_eligibility?: number | null
          broad_industry_category?: string | null
          business_address_line_1?: string | null
          business_address_line_2?: string | null
          business_city?: string | null
          business_count?: number | null
          business_max_score?: number | null
          business_percentage?: number | null
          business_pin_code?: string | null
          business_score?: number | null
          business_state?: string | null
          business_total?: number | null
          cin?: string | null
          company_name?: string | null
          company_status?: string | null
          completed_at?: string | null
          constitution_entity_benchmark?: string | null
          constitution_entity_score?: number | null
          constitution_entity_value?: string | null
          created_at?: string | null
          creditors_days_benchmark?: string | null
          creditors_days_score?: number | null
          creditors_days_value?: number | null
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio_benchmark?: string | null
          current_ratio_score?: number | null
          current_ratio_value?: number | null
          date_of_incorporation?: string | null
          date_of_last_agm?: string | null
          debt_equity_benchmark?: string | null
          debt_equity_score?: number | null
          debt_equity_value?: number | null
          debtors_days_benchmark?: string | null
          debtors_days_score?: number | null
          debtors_days_value?: number | null
          diversion_funds_benchmark?: string | null
          diversion_funds_score?: number | null
          diversion_funds_value?: number | null
          ebitda?: number | null
          ebitda_margin_benchmark?: string | null
          ebitda_margin_score?: number | null
          ebitda_margin_value?: number | null
          email?: string | null
          epfo_compliance_status?: string | null
          epfo_establishment_count?: number | null
          final_eligibility?: number | null
          finance_cost_benchmark?: string | null
          finance_cost_score?: number | null
          finance_cost_value?: number | null
          financial_count?: number | null
          financial_max_score?: number | null
          financial_percentage?: number | null
          financial_score?: number | null
          financial_total?: number | null
          gst_active_count?: number | null
          gst_compliance_benchmark?: string | null
          gst_compliance_score?: number | null
          gst_compliance_status?: string | null
          gst_compliance_value?: string | null
          hygiene_count?: number | null
          hygiene_max_score?: number | null
          hygiene_percentage?: number | null
          hygiene_score?: number | null
          hygiene_total?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          interest_coverage_benchmark?: string | null
          interest_coverage_score?: number | null
          interest_coverage_value?: number | null
          inventory_days_benchmark?: string | null
          inventory_days_score?: number | null
          inventory_days_value?: number | null
          legal_name?: string | null
          lei?: string | null
          listing_status?: string | null
          long_term_borrowings?: number | null
          model_id?: string | null
          model_type?: Database["public"]["Enums"]["model_type"] | null
          ncatd_benchmark?: string | null
          ncatd_score?: number | null
          ncatd_value?: number | null
          net_profit?: number | null
          net_worth_cr?: number | null
          overall_percentage?: number | null
          paid_up_capital_cr?: number | null
          pan?: string | null
          pat_benchmark?: string | null
          pat_score?: number | null
          pat_value?: number | null
          pf_compliance_benchmark?: string | null
          pf_compliance_score?: number | null
          pf_compliance_value?: string | null
          phone?: string | null
          primary_banker_benchmark?: string | null
          primary_banker_score?: number | null
          primary_banker_value?: string | null
          processing_status?:
            | Database["public"]["Enums"]["processing_status"]
            | null
          quick_ratio_benchmark?: string | null
          quick_ratio_score?: number | null
          quick_ratio_value?: number | null
          rating_type_benchmark?: string | null
          rating_type_score?: number | null
          rating_type_value?: string | null
          recent_charges_benchmark?: string | null
          recent_charges_score?: number | null
          recent_charges_value?: string | null
          recommended_limit?: number | null
          region?: string | null
          registered_address_line_1?: string | null
          registered_address_line_2?: string | null
          registered_city?: string | null
          registered_pin_code?: string | null
          registered_state?: string | null
          request_id?: string
          revenue?: number | null
          risk_category?: number | null
          risk_grade?: string | null
          risk_multiplier?: number | null
          risk_score?: number | null
          roce_benchmark?: string | null
          roce_score?: number | null
          roce_value?: number | null
          sales_trend_benchmark?: string | null
          sales_trend_score?: number | null
          sales_trend_value?: string | null
          segment?: string | null
          short_term_borrowings?: number | null
          state?: string | null
          sum_of_charges_cr?: number | null
          tol_tnw_benchmark?: string | null
          tol_tnw_score?: number | null
          tol_tnw_value?: number | null
          total_assets?: number | null
          total_equity?: number | null
          turnover_cr?: number | null
          type_of_entity?: string | null
          updated_at?: string | null
          vintage_benchmark?: string | null
          vintage_score?: number | null
          vintage_value?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_analytics_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "portfolio_analytics_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      portfolio_analytics_sync_errors: {
        Row: {
          created_at: string | null
          error_message: string | null
          error_type: string
          id: string
          last_attempt: string | null
          request_id: string
          resolved: boolean | null
          retry_count: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          error_type: string
          id?: string
          last_attempt?: string | null
          request_id: string
          resolved?: boolean | null
          retry_count?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          error_type?: string
          id?: string
          last_attempt?: string | null
          request_id?: string
          resolved?: boolean | null
          retry_count?: number | null
        }
        Relationships: []
      }
      portfolio_analytics_sync_status: {
        Row: {
          batch_id: string | null
          completed_at: string | null
          created_by: string | null
          error_message: string | null
          failed_records: number | null
          id: string
          metadata: Json | null
          operation_type: string
          processed_records: number | null
          progress_percentage: number | null
          started_at: string | null
          status: string
          successful_records: number | null
          total_records: number | null
        }
        Insert: {
          batch_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          failed_records?: number | null
          id?: string
          metadata?: Json | null
          operation_type: string
          processed_records?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
        }
        Update: {
          batch_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          error_message?: string | null
          failed_records?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          processed_records?: number | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: string
          successful_records?: number | null
          total_records?: number | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          analysis_date: string | null
          analysis_duration_ms: number | null
          analysis_level: string | null
          analysis_result: Json | null
          analysis_summary: Json | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          excel_url: string | null
          file_count: number
          id: string
          is_merged: boolean | null
          json_url: string | null
          last_checked: string | null
          last_webhook: string | null
          merged_from: string[] | null
          metadata: Json | null
          reference_id: string | null
          scoreme_response: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          analysis_date?: string | null
          analysis_duration_ms?: number | null
          analysis_level?: string | null
          analysis_result?: Json | null
          analysis_summary?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          excel_url?: string | null
          file_count?: number
          id?: string
          is_merged?: boolean | null
          json_url?: string | null
          last_checked?: string | null
          last_webhook?: string | null
          merged_from?: string[] | null
          metadata?: Json | null
          reference_id?: string | null
          scoreme_response?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          analysis_date?: string | null
          analysis_duration_ms?: number | null
          analysis_level?: string | null
          analysis_result?: Json | null
          analysis_summary?: Json | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          excel_url?: string | null
          file_count?: number
          id?: string
          is_merged?: boolean | null
          json_url?: string | null
          last_checked?: string | null
          last_webhook?: string | null
          merged_from?: string[] | null
          metadata?: Json | null
          reference_id?: string | null
          scoreme_response?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sqs_job_tracking: {
        Row: {
          attempts: number | null
          cin: string | null
          company_id: string | null
          completed_at: string | null
          error_details: Json | null
          id: string
          identifier_type: string | null
          job_type: string
          last_error: string | null
          max_attempts: number | null
          next_retry_at: string | null
          pan: string | null
          priority: number | null
          processing_started_at: string | null
          queued_at: string | null
          sqs_message_id: string | null
          status: string | null
          triggered_by_request_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attempts?: number | null
          cin?: string | null
          company_id?: string | null
          completed_at?: string | null
          error_details?: Json | null
          id?: string
          identifier_type?: string | null
          job_type: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          pan?: string | null
          priority?: number | null
          processing_started_at?: string | null
          queued_at?: string | null
          sqs_message_id?: string | null
          status?: string | null
          triggered_by_request_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attempts?: number | null
          cin?: string | null
          company_id?: string | null
          completed_at?: string | null
          error_details?: Json | null
          id?: string
          identifier_type?: string | null
          job_type?: string
          last_error?: string | null
          max_attempts?: number | null
          next_retry_at?: string | null
          pan?: string | null
          priority?: number | null
          processing_started_at?: string | null
          queued_at?: string | null
          sqs_message_id?: string | null
          status?: string | null
          triggered_by_request_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sqs_job_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sqs_job_tracking_triggered_by_request_id_fkey"
            columns: ["triggered_by_request_id"]
            isOneToOne: false
            referencedRelation: "user_company_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_company_requests: {
        Row: {
          api_key_used: string | null
          cin: string | null
          company_id: string
          created_at: string | null
          endpoint_called: string
          id: string
          identifier_type: string | null
          ip_address: unknown | null
          is_update_request: boolean | null
          pan: string | null
          request_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          api_key_used?: string | null
          cin?: string | null
          company_id: string
          created_at?: string | null
          endpoint_called: string
          id?: string
          identifier_type?: string | null
          ip_address?: unknown | null
          is_update_request?: boolean | null
          pan?: string | null
          request_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          api_key_used?: string | null
          cin?: string | null
          company_id?: string
          created_at?: string | null
          endpoint_called?: string
          id?: string
          identifier_type?: string | null
          ip_address?: unknown | null
          is_update_request?: boolean | null
          pan?: string | null
          request_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_company_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quota_usage: {
        Row: {
          base_updates_limit: number | null
          base_updates_used: number | null
          company_id: string
          comprehensive_updates_limit: number | null
          comprehensive_updates_used: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          base_updates_limit?: number | null
          base_updates_used?: number | null
          company_id: string
          comprehensive_updates_limit?: number | null
          comprehensive_updates_used?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          base_updates_limit?: number | null
          base_updates_used?: number | null
          company_id?: string
          comprehensive_updates_limit?: number | null
          comprehensive_updates_used?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_quota_usage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_companies: {
        Row: {
          authorized_capital: number | null
          cin: string | null
          company_class: string | null
          company_name: string | null
          company_size: string | null
          company_state_code: string | null
          company_status: string | null
          paidup_capital: number | null
          registration_date: string | null
        }
        Insert: {
          authorized_capital?: number | null
          cin?: string | null
          company_class?: string | null
          company_name?: string | null
          company_size?: never
          company_state_code?: string | null
          company_status?: string | null
          paidup_capital?: number | null
          registration_date?: string | null
        }
        Update: {
          authorized_capital?: number | null
          cin?: string | null
          company_class?: string | null
          company_name?: string | null
          company_size?: never
          company_state_code?: string | null
          company_status?: string | null
          paidup_capital?: number | null
          registration_date?: string | null
        }
        Relationships: []
      }
      analysis_summary: {
        Row: {
          analysis_date: string | null
          analysis_level: string | null
          avg_monthly_turnover: number | null
          bounce_ratio: number | null
          client_name: string | null
          completed_at: string | null
          created_at: string | null
          credit_rating: string | null
          credit_score: number | null
          estimated_monthly_emi: number | null
          facility_utilization: number | null
          id: string | null
          reference_id: string | null
          status: string | null
          total_bounces: number | null
          total_turnover: number | null
        }
        Insert: {
          analysis_date?: string | null
          analysis_level?: string | null
          avg_monthly_turnover?: never
          bounce_ratio?: never
          client_name?: never
          completed_at?: string | null
          created_at?: string | null
          credit_rating?: never
          credit_score?: never
          estimated_monthly_emi?: never
          facility_utilization?: never
          id?: string | null
          reference_id?: string | null
          status?: string | null
          total_bounces?: never
          total_turnover?: never
        }
        Update: {
          analysis_date?: string | null
          analysis_level?: string | null
          avg_monthly_turnover?: never
          bounce_ratio?: never
          client_name?: never
          completed_at?: string | null
          created_at?: string | null
          credit_rating?: never
          credit_score?: never
          estimated_monthly_emi?: never
          facility_utilization?: never
          id?: string | null
          reference_id?: string | null
          status?: string | null
          total_bounces?: never
          total_turnover?: never
        }
        Relationships: []
      }
      dashboard_analytics: {
        Row: {
          analysis_level: string | null
          analyzed_requests: number | null
          avg_bounce_ratio: number | null
          avg_credit_score: number | null
          high_risk_count: number | null
          month: string | null
          total_monthly_turnover: number | null
          total_requests: number | null
        }
        Relationships: []
      }
      document_processing_summary: {
        Row: {
          avg_processing_time_minutes: number | null
          count: number | null
          status: Database["public"]["Enums"]["processing_status"] | null
        }
        Relationships: []
      }
      mca_dashboard_stats: {
        Row: {
          active_companies: number | null
          avg_paidup_capital: number | null
          computed_at: string | null
          foreign_companies: number | null
          indian_companies: number | null
          latest_registration: string | null
          states_covered: number | null
          strike_off_companies: number | null
          total_companies: number | null
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          activity_description: string | null
          activity_time: string | null
          activity_type: string | null
          item_id: string | null
          reference_id: string | null
          status: string | null
        }
        Relationships: []
      }
      recent_document_requests: {
        Row: {
          company_name: string | null
          completed_at: string | null
          original_filename: string | null
          processing_time_minutes: number | null
          request_id: string | null
          risk_grade: string | null
          risk_score: number | null
          status: Database["public"]["Enums"]["processing_status"] | null
          submitted_at: string | null
        }
        Relationships: []
      }
      request_summary: {
        Row: {
          actual_file_count: number | null
          completed_at: string | null
          created_at: string | null
          download_count: number | null
          error_message: string | null
          excel_available: boolean | null
          excel_url: string | null
          file_count: number | null
          id: string | null
          is_merged: boolean | null
          json_available: boolean | null
          json_url: string | null
          last_checked: string | null
          last_webhook: string | null
          merged_from: string[] | null
          metadata: Json | null
          reference_id: string | null
          scoreme_response: Json | null
          status: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      sync_monitor: {
        Row: {
          completed_at: string | null
          current_offset: number | null
          duration: string | null
          error_message: string | null
          id: number | null
          percentage: string | null
          progress: string | null
          started_at: string | null
          sync_status: string | null
        }
        Insert: {
          completed_at?: string | null
          current_offset?: number | null
          duration?: never
          error_message?: string | null
          id?: number | null
          percentage?: never
          progress?: never
          started_at?: string | null
          sync_status?: string | null
        }
        Update: {
          completed_at?: string | null
          current_offset?: number | null
          duration?: never
          error_message?: string | null
          id?: number | null
          percentage?: never
          progress?: never
          started_at?: string | null
          sync_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      autocomplete_companies: {
        Args: { limit_param?: number; search_prefix: string }
        Returns: {
          cin: string
          company_name: string
          company_status: string
        }[]
      }
      batch_sync_portfolio_analytics: {
        Args: {
          p_batch_size?: number
          p_created_by?: string
          p_request_ids?: string[]
        }
        Returns: {
          batch_id: string
          message: string
          operation_id: string
          total_records: number
        }[]
      }
      cancel_mca_sync: {
        Args: { sync_id?: number }
        Returns: boolean
      }
      cancel_sync_operation: {
        Args: { p_operation_id: string }
        Returns: {
          message: string
          operation_id: string
          previous_status: string
        }[]
      }
      cleanup_analysis_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_requests: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_sync_status_records: {
        Args: { p_retention_days?: number }
        Returns: {
          deleted_count: number
          message: string
        }[]
      }
      comprehensive_analytics_validation: {
        Args: { p_created_by?: string; p_request_ids?: string[] }
        Returns: {
          invalid_records: number
          operation_id: string
          total_validated: number
          valid_records: number
          validation_details: Json
        }[]
      }
      extract_category_scores: {
        Args: { risk_analysis: Json }
        Returns: {
          banking_count: number
          banking_max_score: number
          banking_percentage: number
          banking_score: number
          banking_total: number
          business_count: number
          business_max_score: number
          business_percentage: number
          business_score: number
          business_total: number
          financial_count: number
          financial_max_score: number
          financial_percentage: number
          financial_score: number
          financial_total: number
          hygiene_count: number
          hygiene_max_score: number
          hygiene_percentage: number
          hygiene_score: number
          hygiene_total: number
        }[]
      }
      extract_company_data: {
        Args: { risk_analysis: Json }
        Returns: {
          about_the_company: string
          active_compliance: string
          authorised_capital_cr: number
          broad_industry_category: string
          business_address_line_1: string
          business_address_line_2: string
          business_city: string
          business_pin_code: string
          business_state: string
          cin: string
          company_status: string
          date_of_incorporation: string
          date_of_last_agm: string
          email: string
          legal_name: string
          lei: string
          listing_status: string
          paid_up_capital_cr: number
          pan: string
          phone: string
          registered_address_line_1: string
          registered_address_line_2: string
          registered_city: string
          registered_pin_code: string
          registered_state: string
          segment: string
          sum_of_charges_cr: number
          type_of_entity: string
          website: string
        }[]
      }
      extract_compliance_status: {
        Args: { extracted_data: Json }
        Returns: {
          audit_qualification_status: string
          epfo_compliance_status: string
          epfo_establishment_count: number
          gst_active_count: number
          gst_compliance_status: string
        }[]
      }
      extract_compliance_status_from_risk_analysis: {
        Args: { risk_analysis: Json }
        Returns: {
          audit_qualification_status: string
          epfo_compliance_status: string
          epfo_establishment_count: number
          gst_active_count: number
          gst_compliance_status: string
        }[]
      }
      extract_financial_data: {
        Args: { risk_analysis: Json }
        Returns: {
          current_assets: number
          current_liabilities: number
          ebitda: number
          long_term_borrowings: number
          net_profit: number
          revenue: number
          short_term_borrowings: number
          total_assets: number
          total_equity: number
        }[]
      }
      extract_parameter_scores: {
        Args: { risk_analysis: Json }
        Returns: {
          constitution_entity_benchmark: string
          constitution_entity_score: number
          constitution_entity_value: string
          creditors_days_benchmark: string
          creditors_days_score: number
          creditors_days_value: number
          current_ratio_benchmark: string
          current_ratio_score: number
          current_ratio_value: number
          debt_equity_benchmark: string
          debt_equity_score: number
          debt_equity_value: number
          debtors_days_benchmark: string
          debtors_days_score: number
          debtors_days_value: number
          diversion_funds_benchmark: string
          diversion_funds_score: number
          diversion_funds_value: number
          ebitda_margin_benchmark: string
          ebitda_margin_score: number
          ebitda_margin_value: number
          finance_cost_benchmark: string
          finance_cost_score: number
          finance_cost_value: number
          gst_compliance_benchmark: string
          gst_compliance_score: number
          gst_compliance_value: string
          interest_coverage_benchmark: string
          interest_coverage_score: number
          interest_coverage_value: number
          inventory_days_benchmark: string
          inventory_days_score: number
          inventory_days_value: number
          ncatd_benchmark: string
          ncatd_score: number
          ncatd_value: number
          pat_benchmark: string
          pat_score: number
          pat_value: number
          pf_compliance_benchmark: string
          pf_compliance_score: number
          pf_compliance_value: string
          primary_banker_benchmark: string
          primary_banker_score: number
          primary_banker_value: string
          quick_ratio_benchmark: string
          quick_ratio_score: number
          quick_ratio_value: number
          rating_type_benchmark: string
          rating_type_score: number
          rating_type_value: string
          recent_charges_benchmark: string
          recent_charges_score: number
          recent_charges_value: string
          roce_benchmark: string
          roce_score: number
          roce_value: number
          sales_trend_benchmark: string
          sales_trend_score: number
          sales_trend_value: string
          tol_tnw_benchmark: string
          tol_tnw_score: number
          tol_tnw_value: number
          vintage_benchmark: string
          vintage_score: number
          vintage_value: string
        }[]
      }
      generate_conversation_title: {
        Args: { conversation_uuid: string }
        Returns: string
      }
      get_analysis_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_analytics_table_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          error_records: number
          last_sync_time: string
          pending_sync: number
          sync_coverage_percentage: number
          synced_records: number
          total_records: number
        }[]
      }
      get_company_suggestions: {
        Args: { search_prefix: string; suggestion_limit?: number }
        Returns: {
          cin: string
          company_count: number
          suggestion: string
        }[]
      }
      get_mca_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_party_analysis_summary: {
        Args: { request_uuid: string }
        Returns: Json
      }
      get_request_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_risk_distribution: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_sync_health_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          last_updated: string
          metric_name: string
          metric_unit: string
          metric_value: number
          status: string
        }[]
      }
      get_sync_operation_status: {
        Args: { p_operation_id?: string }
        Returns: {
          batch_id: string
          completed_at: string
          duration_seconds: number
          error_message: string
          failed_records: number
          metadata: Json
          operation_id: string
          operation_type: string
          processed_records: number
          progress_percentage: number
          started_at: string
          status: string
          successful_records: number
          total_records: number
        }[]
      }
      get_sync_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          completed_at: string
          current_offset: number
          error_message: string
          estimated_completion: string
          fetched_records: number
          id: number
          progress_percentage: number
          started_at: string
          sync_status: string
          total_records: number
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_user_quota: {
        Args: {
          p_company_id: string
          p_field: string
          p_user_id: string
          p_year: number
        }
        Returns: undefined
      }
      rebuild_analytics_table: {
        Args: Record<PropertyKey, never>
        Returns: {
          execution_time_seconds: number
          failed_syncs: number
          successful_syncs: number
          total_processed: number
        }[]
      }
      refresh_dashboard_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_mca_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      retry_failed_syncs: {
        Args: { max_retries?: number }
        Returns: {
          message: string
          request_id: string
          retry_status: string
        }[]
      }
      rollback_analytics_sync: {
        Args: { p_created_by?: string; p_request_ids: string[] }
        Returns: {
          message: string
          operation_id: string
          rolled_back_count: number
        }[]
      }
      schedule_next_mca_batch: {
        Args: { sync_id: number }
        Returns: boolean
      }
      search_companies_advanced: {
        Args: {
          class_filter?: string
          limit_param?: number
          offset_param?: number
          search_query: string
          state_filter?: string
          status_filter?: string
          use_fuzzy?: boolean
        }
        Returns: {
          authorized_capital: number
          cin: string
          company_category: string
          company_class: string
          company_name: string
          company_roc_code: string
          company_state_code: string
          company_status: string
          company_sub_category: string
          company_type: string
          industrial_classification: string
          listing_status: string
          nic_code: string
          paidup_capital: number
          registered_office_address: string
          registration_date: string
          relevance_score: number
        }[]
      }
      search_companies_fts: {
        Args: {
          class_filter?: string
          result_limit?: number
          result_offset?: number
          search_term: string
          state_filter?: string
          status_filter?: string
        }
        Returns: {
          cin: string
          company_class: string
          company_name: string
          company_roc_code: string
          company_state_code: string
          company_status: string
          rank_score: number
        }[]
      }
      search_companies_hybrid: {
        Args: {
          class_filter?: string
          result_limit?: number
          result_offset?: number
          search_term: string
          state_filter?: string
          status_filter?: string
        }
        Returns: {
          cin: string
          company_class: string
          company_name: string
          company_roc_code: string
          company_state_code: string
          company_status: string
          match_type: string
          score: number
        }[]
      }
      search_companies_trigram: {
        Args: {
          class_filter?: string
          min_similarity?: number
          result_limit?: number
          result_offset?: number
          search_term: string
          state_filter?: string
          status_filter?: string
        }
        Returns: {
          cin: string
          company_class: string
          company_name: string
          company_roc_code: string
          company_state_code: string
          company_status: string
          similarity_score: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      setup_mca_secrets: {
        Args: { p_service_role_key: string; p_supabase_url: string }
        Returns: boolean
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      start_mca_sync: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      sync_portfolio_analytics: {
        Args: { p_request_id?: string }
        Returns: {
          error_count: number
          message: string
          synced_count: number
        }[]
      }
      test_data_extraction: {
        Args: { p_request_id: string }
        Returns: {
          extraction_type: string
          field_name: string
          field_value: string
          status: string
        }[]
      }
      validate_analytics_data: {
        Args: { p_request_id?: string }
        Returns: {
          issues: string[]
          request_id: string
          validation_status: string
        }[]
      }
      validate_analytics_sync_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          count_value: number
          description: string
          details: string
          status_type: string
        }[]
      }
    }
    Enums: {
      industry_type: "manufacturing" | "manufacturing-oem" | "epc"
      model_type: "with_banking" | "without_banking"
      processing_status:
        | "submitted"
        | "processing"
        | "completed"
        | "failed"
        | "upload_pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      industry_type: ["manufacturing", "manufacturing-oem", "epc"],
      model_type: ["with_banking", "without_banking"],
      processing_status: [
        "submitted",
        "processing",
        "completed",
        "failed",
        "upload_pending",
      ],
    },
  },
} as const
