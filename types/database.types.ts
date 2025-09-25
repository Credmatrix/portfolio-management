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
          actual_credit_limit_approved_validity: string | null
          ad_hoc_limit: number | null
          ad_hoc_limit_validity_date: string | null
          ar_remarks: string | null
          ar_values: number | null
          case_notes: string | null
          collection_feedback:
            | Database["public"]["Enums"]["collection_feedback_type"]
            | null
          collection_remarks: string | null
          created_at: string | null
          created_by: string | null
          credit_type: Database["public"]["Enums"]["credit_type"] | null
          dpd_behavior: string | null
          dpd_remarks: string | null
          general_remarks: string | null
          id: string
          insurance_cover: number | null
          insurance_coverage_requested_amount: number | null
          insurance_remarks: string | null
          insurance_validity: string | null
          limit_validity_date: string | null
          lpi: boolean | null
          lpi_received: Database["public"]["Enums"]["lpi_received_type"] | null
          payment_terms: string | null
          repayment: Database["public"]["Enums"]["repayment_type"] | null
          request_id: string
          security_requirements:
            | Database["public"]["Enums"]["security_requirement_type"]
            | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_credit_limit_approved?: number | null
          actual_credit_limit_approved_validity?: string | null
          ad_hoc_limit?: number | null
          ad_hoc_limit_validity_date?: string | null
          ar_remarks?: string | null
          ar_values?: number | null
          case_notes?: string | null
          collection_feedback?:
            | Database["public"]["Enums"]["collection_feedback_type"]
            | null
          collection_remarks?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_type?: Database["public"]["Enums"]["credit_type"] | null
          dpd_behavior?: string | null
          dpd_remarks?: string | null
          general_remarks?: string | null
          id?: string
          insurance_cover?: number | null
          insurance_coverage_requested_amount?: number | null
          insurance_remarks?: string | null
          insurance_validity?: string | null
          limit_validity_date?: string | null
          lpi?: boolean | null
          lpi_received?: Database["public"]["Enums"]["lpi_received_type"] | null
          payment_terms?: string | null
          repayment?: Database["public"]["Enums"]["repayment_type"] | null
          request_id: string
          security_requirements?:
            | Database["public"]["Enums"]["security_requirement_type"]
            | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_credit_limit_approved?: number | null
          actual_credit_limit_approved_validity?: string | null
          ad_hoc_limit?: number | null
          ad_hoc_limit_validity_date?: string | null
          ar_remarks?: string | null
          ar_values?: number | null
          case_notes?: string | null
          collection_feedback?:
            | Database["public"]["Enums"]["collection_feedback_type"]
            | null
          collection_remarks?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_type?: Database["public"]["Enums"]["credit_type"] | null
          dpd_behavior?: string | null
          dpd_remarks?: string | null
          general_remarks?: string | null
          id?: string
          insurance_cover?: number | null
          insurance_coverage_requested_amount?: number | null
          insurance_remarks?: string | null
          insurance_validity?: string | null
          limit_validity_date?: string | null
          lpi?: boolean | null
          lpi_received?: Database["public"]["Enums"]["lpi_received_type"] | null
          payment_terms?: string | null
          repayment?: Database["public"]["Enums"]["repayment_type"] | null
          request_id?: string
          security_requirements?:
            | Database["public"]["Enums"]["security_requirement_type"]
            | null
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
      deep_research_alerts: {
        Row: {
          business_impact: Json | null
          category: string
          confidence_score: number | null
          created_at: string | null
          description: string
          financial_impact: string | null
          id: string
          job_id: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          source_evidence: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
        }
        Insert: {
          business_impact?: Json | null
          category: string
          confidence_score?: number | null
          created_at?: string | null
          description: string
          financial_impact?: string | null
          id?: string
          job_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: string
          source_evidence?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Update: {
          business_impact?: Json | null
          category?: string
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          financial_impact?: string | null
          id?: string
          job_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          source_evidence?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_alerts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_alerts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_api_failures: {
        Row: {
          api_name: string
          circuit_breaker_triggered: boolean | null
          created_at: string | null
          endpoint_url: string | null
          error_message: string | null
          failure_type: string
          fallback_used: boolean | null
          http_status_code: number | null
          id: string
          job_id: string | null
          request_payload: Json | null
          resolution_time_ms: number | null
          resolved_at: string | null
          response_headers: Json | null
          retry_count: number | null
          user_id: string | null
        }
        Insert: {
          api_name: string
          circuit_breaker_triggered?: boolean | null
          created_at?: string | null
          endpoint_url?: string | null
          error_message?: string | null
          failure_type: string
          fallback_used?: boolean | null
          http_status_code?: number | null
          id?: string
          job_id?: string | null
          request_payload?: Json | null
          resolution_time_ms?: number | null
          resolved_at?: string | null
          response_headers?: Json | null
          retry_count?: number | null
          user_id?: string | null
        }
        Update: {
          api_name?: string
          circuit_breaker_triggered?: boolean | null
          created_at?: string | null
          endpoint_url?: string | null
          error_message?: string | null
          failure_type?: string
          fallback_used?: boolean | null
          http_status_code?: number | null
          id?: string
          job_id?: string | null
          request_payload?: Json | null
          resolution_time_ms?: number | null
          resolved_at?: string | null
          response_headers?: Json | null
          retry_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_api_failures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_api_failures_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          job_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          job_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          job_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_audit_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_audit_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_error_log: {
        Row: {
          created_at: string | null
          error_category: string
          error_context: Json | null
          error_message: string
          error_severity: string
          fallback_applied: boolean | null
          fallback_strategy: string | null
          id: string
          ip_address: unknown | null
          job_id: string | null
          recoverable: boolean | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          suggested_actions: string[] | null
          technical_details: Json | null
          user_agent: string | null
          user_id: string | null
          user_message: string | null
        }
        Insert: {
          created_at?: string | null
          error_category: string
          error_context?: Json | null
          error_message: string
          error_severity: string
          fallback_applied?: boolean | null
          fallback_strategy?: string | null
          id?: string
          ip_address?: unknown | null
          job_id?: string | null
          recoverable?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_actions?: string[] | null
          technical_details?: Json | null
          user_agent?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Update: {
          created_at?: string | null
          error_category?: string
          error_context?: Json | null
          error_message?: string
          error_severity?: string
          fallback_applied?: boolean | null
          fallback_strategy?: string | null
          id?: string
          ip_address?: unknown | null
          job_id?: string | null
          recoverable?: boolean | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          suggested_actions?: string[] | null
          technical_details?: Json | null
          user_agent?: string | null
          user_id?: string | null
          user_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_error_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_error_log_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_fallback_responses: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_completeness: number | null
          fallback_type: string
          id: string
          job_id: string | null
          limitations: string[] | null
          original_error: string | null
          professional_response: string
          recommendations: string[] | null
          trigger_reason: string
          user_feedback_comments: string | null
          user_feedback_rating: number | null
          user_id: string | null
          verification_level: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_completeness?: number | null
          fallback_type: string
          id?: string
          job_id?: string | null
          limitations?: string[] | null
          original_error?: string | null
          professional_response: string
          recommendations?: string[] | null
          trigger_reason: string
          user_feedback_comments?: string | null
          user_feedback_rating?: number | null
          user_id?: string | null
          verification_level?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_completeness?: number | null
          fallback_type?: string
          id?: string
          job_id?: string | null
          limitations?: string[] | null
          original_error?: string | null
          professional_response?: string
          recommendations?: string[] | null
          trigger_reason?: string
          user_feedback_comments?: string | null
          user_feedback_rating?: number | null
          user_id?: string | null
          verification_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_fallback_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_fallback_responses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_findings: {
        Row: {
          business_impact_detailed: Json | null
          completed_at: string | null
          comprehensive_analysis: Json | null
          confidence_score: number | null
          content: string | null
          created_at: string | null
          critical_alerts: Json | null
          data_sources_count: number | null
          entity_focus: Json | null
          error_message: string | null
          id: string
          iteration_id: string | null
          iteration_number: number | null
          job_id: string
          query_text: string
          raw_jina_content: string | null
          requires_attention: boolean | null
          research_type: string
          risk_score: number | null
          source_verification: Json | null
          started_at: string | null
          success: boolean | null
          tokens_used: number | null
          verification_level: string | null
        }
        Insert: {
          business_impact_detailed?: Json | null
          completed_at?: string | null
          comprehensive_analysis?: Json | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string | null
          critical_alerts?: Json | null
          data_sources_count?: number | null
          entity_focus?: Json | null
          error_message?: string | null
          id?: string
          iteration_id?: string | null
          iteration_number?: number | null
          job_id: string
          query_text: string
          raw_jina_content?: string | null
          requires_attention?: boolean | null
          research_type: string
          risk_score?: number | null
          source_verification?: Json | null
          started_at?: string | null
          success?: boolean | null
          tokens_used?: number | null
          verification_level?: string | null
        }
        Update: {
          business_impact_detailed?: Json | null
          completed_at?: string | null
          comprehensive_analysis?: Json | null
          confidence_score?: number | null
          content?: string | null
          created_at?: string | null
          critical_alerts?: Json | null
          data_sources_count?: number | null
          entity_focus?: Json | null
          error_message?: string | null
          id?: string
          iteration_id?: string | null
          iteration_number?: number | null
          job_id?: string
          query_text?: string
          raw_jina_content?: string | null
          requires_attention?: boolean | null
          research_type?: string
          risk_score?: number | null
          source_verification?: Json | null
          started_at?: string | null
          success?: boolean | null
          tokens_used?: number | null
          verification_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_findings_iteration_id_fkey"
            columns: ["iteration_id"]
            isOneToOne: false
            referencedRelation: "deep_research_iterations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_findings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_findings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_findings_summary: {
        Row: {
          analysis_method: string | null
          confidence_level: string | null
          created_at: string | null
          critical_findings: number | null
          currency: string | null
          data_completeness_score: number | null
          high_risk_findings: number | null
          id: string
          info_findings: number | null
          job_id: string | null
          low_risk_findings: number | null
          medium_risk_findings: number | null
          overall_risk_level: string | null
          processing_time_seconds: number | null
          request_id: string
          tokens_consumed: number | null
          total_financial_exposure_estimated: number | null
          total_findings: number | null
          updated_at: string | null
          verification_score: number | null
        }
        Insert: {
          analysis_method?: string | null
          confidence_level?: string | null
          created_at?: string | null
          critical_findings?: number | null
          currency?: string | null
          data_completeness_score?: number | null
          high_risk_findings?: number | null
          id?: string
          info_findings?: number | null
          job_id?: string | null
          low_risk_findings?: number | null
          medium_risk_findings?: number | null
          overall_risk_level?: string | null
          processing_time_seconds?: number | null
          request_id: string
          tokens_consumed?: number | null
          total_financial_exposure_estimated?: number | null
          total_findings?: number | null
          updated_at?: string | null
          verification_score?: number | null
        }
        Update: {
          analysis_method?: string | null
          confidence_level?: string | null
          created_at?: string | null
          critical_findings?: number | null
          currency?: string | null
          data_completeness_score?: number | null
          high_risk_findings?: number | null
          id?: string
          info_findings?: number | null
          job_id?: string | null
          low_risk_findings?: number | null
          medium_risk_findings?: number | null
          overall_risk_level?: string | null
          processing_time_seconds?: number | null
          request_id?: string
          tokens_consumed?: number | null
          total_financial_exposure_estimated?: number | null
          total_findings?: number | null
          updated_at?: string | null
          verification_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_findings_summary_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_findings_summary_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_iterations: {
        Row: {
          budget_tokens: number | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string | null
          data_quality_score: number | null
          error_message: string | null
          findings: Json | null
          id: string
          iteration_number: number
          job_id: string
          research_focus: Json
          research_type: string
          search_depth: string | null
          started_at: string | null
          status: string
          structured_findings: Json | null
          tokens_used: number | null
          updated_at: string | null
        }
        Insert: {
          budget_tokens?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          error_message?: string | null
          findings?: Json | null
          id?: string
          iteration_number: number
          job_id: string
          research_focus?: Json
          research_type: string
          search_depth?: string | null
          started_at?: string | null
          status?: string
          structured_findings?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Update: {
          budget_tokens?: number | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string | null
          data_quality_score?: number | null
          error_message?: string | null
          findings?: Json | null
          id?: string
          iteration_number?: number
          job_id?: string
          research_focus?: Json
          research_type?: string
          search_depth?: string | null
          started_at?: string | null
          status?: string
          structured_findings?: Json | null
          tokens_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_iterations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_iterations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_jobs: {
        Row: {
          api_calls_made: number | null
          auto_consolidate: boolean | null
          auto_report_eligible: boolean | null
          budget_tokens: number | null
          circuit_breaker_status: string | null
          completed_at: string | null
          consolidation_required: boolean | null
          created_at: string | null
          critical_alerts_count: number | null
          current_iteration: number | null
          data_quality_score: number | null
          error_count: number | null
          error_handling_enabled: boolean | null
          error_message: string | null
          escalated_at: string | null
          escalated_by: string | null
          fallback_strategy: string | null
          findings: Json | null
          id: string
          iteration_strategy: string | null
          job_type: string
          last_error_at: string | null
          max_attempts: number | null
          max_iterations: number | null
          priority: string | null
          processing_notes: string | null
          progress: number | null
          quality_score: number | null
          recommendations: string[] | null
          request_id: string
          requires_attention: boolean | null
          research_scope: Json | null
          risk_assessment: Json | null
          started_at: string | null
          status: string
          tokens_used: number | null
          two_step_processing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_calls_made?: number | null
          auto_consolidate?: boolean | null
          auto_report_eligible?: boolean | null
          budget_tokens?: number | null
          circuit_breaker_status?: string | null
          completed_at?: string | null
          consolidation_required?: boolean | null
          created_at?: string | null
          critical_alerts_count?: number | null
          current_iteration?: number | null
          data_quality_score?: number | null
          error_count?: number | null
          error_handling_enabled?: boolean | null
          error_message?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          fallback_strategy?: string | null
          findings?: Json | null
          id?: string
          iteration_strategy?: string | null
          job_type: string
          last_error_at?: string | null
          max_attempts?: number | null
          max_iterations?: number | null
          priority?: string | null
          processing_notes?: string | null
          progress?: number | null
          quality_score?: number | null
          recommendations?: string[] | null
          request_id: string
          requires_attention?: boolean | null
          research_scope?: Json | null
          risk_assessment?: Json | null
          started_at?: string | null
          status?: string
          tokens_used?: number | null
          two_step_processing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_calls_made?: number | null
          auto_consolidate?: boolean | null
          auto_report_eligible?: boolean | null
          budget_tokens?: number | null
          circuit_breaker_status?: string | null
          completed_at?: string | null
          consolidation_required?: boolean | null
          created_at?: string | null
          critical_alerts_count?: number | null
          current_iteration?: number | null
          data_quality_score?: number | null
          error_count?: number | null
          error_handling_enabled?: boolean | null
          error_message?: string | null
          escalated_at?: string | null
          escalated_by?: string | null
          fallback_strategy?: string | null
          findings?: Json | null
          id?: string
          iteration_strategy?: string | null
          job_type?: string
          last_error_at?: string | null
          max_attempts?: number | null
          max_iterations?: number | null
          priority?: string | null
          processing_notes?: string | null
          progress?: number | null
          quality_score?: number | null
          recommendations?: string[] | null
          request_id?: string
          requires_attention?: boolean | null
          research_scope?: Json | null
          risk_assessment?: Json | null
          started_at?: string | null
          status?: string
          tokens_used?: number | null
          two_step_processing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "deep_research_jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      deep_research_performance_metrics: {
        Row: {
          average_confidence_level: number | null
          average_cost_per_job: number | null
          average_processing_time_seconds: number | null
          average_quality_score: number | null
          average_user_rating: number | null
          date: string
          id: string
          jobs_requiring_attention: number | null
          total_api_calls: number | null
          total_critical_alerts: number | null
          total_high_risk_findings: number | null
          total_jobs_completed: number | null
          total_jobs_failed: number | null
          total_jobs_started: number | null
          total_reports_generated: number | null
          total_tokens_consumed: number | null
          total_user_feedback: number | null
        }
        Insert: {
          average_confidence_level?: number | null
          average_cost_per_job?: number | null
          average_processing_time_seconds?: number | null
          average_quality_score?: number | null
          average_user_rating?: number | null
          date?: string
          id?: string
          jobs_requiring_attention?: number | null
          total_api_calls?: number | null
          total_critical_alerts?: number | null
          total_high_risk_findings?: number | null
          total_jobs_completed?: number | null
          total_jobs_failed?: number | null
          total_jobs_started?: number | null
          total_reports_generated?: number | null
          total_tokens_consumed?: number | null
          total_user_feedback?: number | null
        }
        Update: {
          average_confidence_level?: number | null
          average_cost_per_job?: number | null
          average_processing_time_seconds?: number | null
          average_quality_score?: number | null
          average_user_rating?: number | null
          date?: string
          id?: string
          jobs_requiring_attention?: number | null
          total_api_calls?: number | null
          total_critical_alerts?: number | null
          total_high_risk_findings?: number | null
          total_jobs_completed?: number | null
          total_jobs_failed?: number | null
          total_jobs_started?: number | null
          total_reports_generated?: number | null
          total_tokens_consumed?: number | null
          total_user_feedback?: number | null
        }
        Relationships: []
      }
      deep_research_quality_metrics: {
        Row: {
          accuracy: number
          completeness: number
          consistency: number
          created_at: string | null
          critical_issues_count: number | null
          data_completeness_breakdown: Json | null
          id: string
          iteration_id: string | null
          job_id: string | null
          overall_score: number
          quality_report: Json | null
          recommendations_count: number | null
          reliability: number
          source_reliability_scores: Json | null
          timeliness: number
          uniqueness: number
          validated_by: string | null
          validation_method: string | null
          validation_results: Json | null
          validity: number
          verification_status: string
          warnings_count: number | null
        }
        Insert: {
          accuracy: number
          completeness: number
          consistency: number
          created_at?: string | null
          critical_issues_count?: number | null
          data_completeness_breakdown?: Json | null
          id?: string
          iteration_id?: string | null
          job_id?: string | null
          overall_score: number
          quality_report?: Json | null
          recommendations_count?: number | null
          reliability: number
          source_reliability_scores?: Json | null
          timeliness: number
          uniqueness: number
          validated_by?: string | null
          validation_method?: string | null
          validation_results?: Json | null
          validity: number
          verification_status: string
          warnings_count?: number | null
        }
        Update: {
          accuracy?: number
          completeness?: number
          consistency?: number
          created_at?: string | null
          critical_issues_count?: number | null
          data_completeness_breakdown?: Json | null
          id?: string
          iteration_id?: string | null
          job_id?: string | null
          overall_score?: number
          quality_report?: Json | null
          recommendations_count?: number | null
          reliability?: number
          source_reliability_scores?: Json | null
          timeliness?: number
          uniqueness?: number
          validated_by?: string | null
          validation_method?: string | null
          validation_results?: Json | null
          validity?: number
          verification_status?: string
          warnings_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_quality_metrics_iteration_id_fkey"
            columns: ["iteration_id"]
            isOneToOne: false
            referencedRelation: "deep_research_iterations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_quality_metrics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_research_quality_metrics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      deep_research_reports: {
        Row: {
          analysis_depth: string | null
          auto_generated: boolean | null
          created_at: string | null
          critical_findings_count: number | null
          data_quality_score: number | null
          executive_summary: string | null
          expires_at: string | null
          export_formats: string[] | null
          findings_summary: Json | null
          generated_at: string | null
          id: string
          last_updated_at: string | null
          pdf_url: string | null
          processing_method: string | null
          recommendations: string[] | null
          report_type: string
          report_version: string | null
          request_id: string
          risk_level: string | null
          sections: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_depth?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          critical_findings_count?: number | null
          data_quality_score?: number | null
          executive_summary?: string | null
          expires_at?: string | null
          export_formats?: string[] | null
          findings_summary?: Json | null
          generated_at?: string | null
          id?: string
          last_updated_at?: string | null
          pdf_url?: string | null
          processing_method?: string | null
          recommendations?: string[] | null
          report_type?: string
          report_version?: string | null
          request_id: string
          risk_level?: string | null
          sections?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_depth?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          critical_findings_count?: number | null
          data_quality_score?: number | null
          executive_summary?: string | null
          expires_at?: string | null
          export_formats?: string[] | null
          findings_summary?: Json | null
          generated_at?: string | null
          id?: string
          last_updated_at?: string | null
          pdf_url?: string | null
          processing_method?: string | null
          recommendations?: string[] | null
          report_type?: string
          report_version?: string | null
          request_id?: string
          risk_level?: string | null
          sections?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_reports_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "deep_research_reports_request_id_fkey"
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
          cin: string | null
          company_name: string | null
          completed_at: string | null
          created_at: string | null
          credit_rating: string | null
          currency: string | null
          epfo_compliance_rate: number | null
          epfo_compliance_status: string | null
          error_message: string | null
          extracted_data: Json | null
          file_extension: string | null
          file_size: number | null
          financial_parameters: number | null
          gst_compliance_rate: number | null
          gst_compliance_status: string | null
          hygiene_parameters: number | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"]
          location_city: string | null
          location_combined: string | null
          location_state: string | null
          model_type: Database["public"]["Enums"]["model_type"] | null
          organization_id: string | null
          original_filename: string | null
          pan: string | null
          pdf_file_size: number | null
          pdf_filename: string | null
          pdf_s3_key: string | null
          processing_started_at: string | null
          processing_summary: Json | null
          recommended_limit: number | null
          request_id: string | null
          retry_count: number | null
          risk_analysis: Json | null
          risk_grade: string | null
          risk_score: number | null
          s3_folder_path: string | null
          s3_upload_key: string | null
          sector: string | null
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
          cin?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          credit_rating?: string | null
          currency?: string | null
          epfo_compliance_rate?: number | null
          epfo_compliance_status?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_extension?: string | null
          file_size?: number | null
          financial_parameters?: number | null
          gst_compliance_rate?: number | null
          gst_compliance_status?: string | null
          hygiene_parameters?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          location_city?: string | null
          location_combined?: string | null
          location_state?: string | null
          model_type?: Database["public"]["Enums"]["model_type"] | null
          organization_id?: string | null
          original_filename?: string | null
          pan?: string | null
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_s3_key?: string | null
          processing_started_at?: string | null
          processing_summary?: Json | null
          recommended_limit?: number | null
          request_id?: string | null
          retry_count?: number | null
          risk_analysis?: Json | null
          risk_grade?: string | null
          risk_score?: number | null
          s3_folder_path?: string | null
          s3_upload_key?: string | null
          sector?: string | null
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
          cin?: string | null
          company_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          credit_rating?: string | null
          currency?: string | null
          epfo_compliance_rate?: number | null
          epfo_compliance_status?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_extension?: string | null
          file_size?: number | null
          financial_parameters?: number | null
          gst_compliance_rate?: number | null
          gst_compliance_status?: string | null
          hygiene_parameters?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"]
          location_city?: string | null
          location_combined?: string | null
          location_state?: string | null
          model_type?: Database["public"]["Enums"]["model_type"] | null
          organization_id?: string | null
          original_filename?: string | null
          pan?: string | null
          pdf_file_size?: number | null
          pdf_filename?: string | null
          pdf_s3_key?: string | null
          processing_started_at?: string | null
          processing_summary?: Json | null
          recommended_limit?: number | null
          request_id?: string | null
          retry_count?: number | null
          risk_analysis?: Json | null
          risk_grade?: string | null
          risk_score?: number | null
          s3_folder_path?: string | null
          s3_upload_key?: string | null
          sector?: string | null
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
      gst_api_requests: {
        Row: {
          api_endpoint: string | null
          api_provider: string | null
          completed_at: string | null
          cost_inr: number | null
          created_at: string | null
          error_message: string | null
          financial_year: string
          gstin: string
          id: string
          request_id: string
          request_payload: Json | null
          requested_at: string | null
          response_data: Json | null
          response_status: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          api_provider?: string | null
          completed_at?: string | null
          cost_inr?: number | null
          created_at?: string | null
          error_message?: string | null
          financial_year: string
          gstin: string
          id?: string
          request_id: string
          request_payload?: Json | null
          requested_at?: string | null
          response_data?: Json | null
          response_status?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          api_provider?: string | null
          completed_at?: string | null
          cost_inr?: number | null
          created_at?: string | null
          error_message?: string | null
          financial_year?: string
          gstin?: string
          id?: string
          request_id?: string
          request_payload?: Json | null
          requested_at?: string | null
          response_data?: Json | null
          response_status?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gst_api_requests_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "fk_gst_api_requests_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      gst_filing_data: {
        Row: {
          arn: string | null
          created_at: string | null
          data_source: string | null
          date_of_filing: string | null
          fetched_at: string | null
          filing_mode: string | null
          financial_year: string
          gstin: string
          id: string
          is_valid: boolean | null
          return_period: string
          return_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          arn?: string | null
          created_at?: string | null
          data_source?: string | null
          date_of_filing?: string | null
          fetched_at?: string | null
          filing_mode?: string | null
          financial_year: string
          gstin: string
          id?: string
          is_valid?: boolean | null
          return_period: string
          return_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          arn?: string | null
          created_at?: string | null
          data_source?: string | null
          date_of_filing?: string | null
          fetched_at?: string | null
          filing_mode?: string | null
          financial_year?: string
          gstin?: string
          id?: string
          is_valid?: boolean | null
          return_period?: string
          return_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gst_refresh_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          failed_gstins: number | null
          financial_year: string
          gstins: string[]
          id: string
          priority: number | null
          processed_gstins: number | null
          progress: number | null
          queued_at: string | null
          request_id: string
          results: Json | null
          started_at: string | null
          status: string | null
          total_gstins: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_gstins?: number | null
          financial_year: string
          gstins: string[]
          id?: string
          priority?: number | null
          processed_gstins?: number | null
          progress?: number | null
          queued_at?: string | null
          request_id: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          total_gstins?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          failed_gstins?: number | null
          financial_year?: string
          gstins?: string[]
          id?: string
          priority?: number | null
          processed_gstins?: number | null
          progress?: number | null
          queued_at?: string | null
          request_id?: string
          results?: Json | null
          started_at?: string | null
          status?: string | null
          total_gstins?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gst_refresh_jobs_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "fk_gst_refresh_jobs_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
      }
      gst_refresh_quotas: {
        Row: {
          created_at: string | null
          id: string
          last_refresh_at: string | null
          last_refresh_gstins: string[] | null
          max_refreshes_per_month: number | null
          month_year: string
          refresh_count: number | null
          request_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_refresh_at?: string | null
          last_refresh_gstins?: string[] | null
          max_refreshes_per_month?: number | null
          month_year: string
          refresh_count?: number | null
          request_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_refresh_at?: string | null
          last_refresh_gstins?: string[] | null
          max_refreshes_per_month?: number | null
          month_year?: string
          refresh_count?: number | null
          request_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_gst_refresh_quotas_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "fk_gst_refresh_quotas_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
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
      organizations: {
        Row: {
          address: string | null
          annual_revenue: number | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          employee_count: number | null
          established_date: string | null
          id: string
          industry: Database["public"]["Enums"]["industry_type"] | null
          is_active: boolean | null
          logo_key: string | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          is_active?: boolean | null
          logo_key?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          established_date?: string | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_type"] | null
          is_active?: boolean | null
          logo_key?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
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
      research_entity_analysis: {
        Row: {
          analysis_results: Json
          business_impact: Json | null
          citations: Json | null
          confidence_level: string | null
          created_at: string | null
          data_completeness: number | null
          entity_identifier: string
          entity_name: string
          entity_type: string
          id: string
          iteration_id: string | null
          job_id: string
          risk_assessment: Json | null
          sources: Json | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          analysis_results?: Json
          business_impact?: Json | null
          citations?: Json | null
          confidence_level?: string | null
          created_at?: string | null
          data_completeness?: number | null
          entity_identifier: string
          entity_name: string
          entity_type: string
          id?: string
          iteration_id?: string | null
          job_id: string
          risk_assessment?: Json | null
          sources?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          analysis_results?: Json
          business_impact?: Json | null
          citations?: Json | null
          confidence_level?: string | null
          created_at?: string | null
          data_completeness?: number | null
          entity_identifier?: string
          entity_name?: string
          entity_type?: string
          id?: string
          iteration_id?: string | null
          job_id?: string
          risk_assessment?: Json | null
          sources?: Json | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_entity_analysis_iteration_id_fkey"
            columns: ["iteration_id"]
            isOneToOne: false
            referencedRelation: "deep_research_iterations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_entity_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_entity_analysis_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      research_findings_consolidation: {
        Row: {
          comprehensive_risk_assessment: Json | null
          consolidated_at: string | null
          consolidated_findings: Json
          consolidation_strategy: string | null
          created_at: string | null
          data_completeness_score: number | null
          directors_analysis: Json | null
          follow_up_required: string[] | null
          id: string
          iterations_included: number[]
          job_id: string
          litigation_findings: Json | null
          overall_confidence_score: number | null
          primary_entity_analysis: Json | null
          regulatory_findings: Json | null
          requires_immediate_attention: boolean | null
          subsidiaries_analysis: Json | null
          updated_at: string | null
          verification_level: string | null
        }
        Insert: {
          comprehensive_risk_assessment?: Json | null
          consolidated_at?: string | null
          consolidated_findings?: Json
          consolidation_strategy?: string | null
          created_at?: string | null
          data_completeness_score?: number | null
          directors_analysis?: Json | null
          follow_up_required?: string[] | null
          id?: string
          iterations_included: number[]
          job_id: string
          litigation_findings?: Json | null
          overall_confidence_score?: number | null
          primary_entity_analysis?: Json | null
          regulatory_findings?: Json | null
          requires_immediate_attention?: boolean | null
          subsidiaries_analysis?: Json | null
          updated_at?: string | null
          verification_level?: string | null
        }
        Update: {
          comprehensive_risk_assessment?: Json | null
          consolidated_at?: string | null
          consolidated_findings?: Json
          consolidation_strategy?: string | null
          created_at?: string | null
          data_completeness_score?: number | null
          directors_analysis?: Json | null
          follow_up_required?: string[] | null
          id?: string
          iterations_included?: number[]
          job_id?: string
          litigation_findings?: Json | null
          overall_confidence_score?: number | null
          primary_entity_analysis?: Json | null
          regulatory_findings?: Json | null
          requires_immediate_attention?: boolean | null
          subsidiaries_analysis?: Json | null
          updated_at?: string | null
          verification_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_findings_consolidation_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_findings_consolidation_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
      }
      research_iteration_comparisons: {
        Row: {
          compared_at: string | null
          confidence_improvement: number | null
          created_at: string | null
          data_quality_improvement: number | null
          differences: Json
          id: string
          iteration_1_id: string
          iteration_2_id: string
          job_id: string
          modified_findings_count: number | null
          new_findings_count: number | null
          recommendation: string | null
          removed_findings_count: number | null
          significance_level: string | null
        }
        Insert: {
          compared_at?: string | null
          confidence_improvement?: number | null
          created_at?: string | null
          data_quality_improvement?: number | null
          differences?: Json
          id?: string
          iteration_1_id: string
          iteration_2_id: string
          job_id: string
          modified_findings_count?: number | null
          new_findings_count?: number | null
          recommendation?: string | null
          removed_findings_count?: number | null
          significance_level?: string | null
        }
        Update: {
          compared_at?: string | null
          confidence_improvement?: number | null
          created_at?: string | null
          data_quality_improvement?: number | null
          differences?: Json
          id?: string
          iteration_1_id?: string
          iteration_2_id?: string
          job_id?: string
          modified_findings_count?: number | null
          new_findings_count?: number | null
          recommendation?: string | null
          removed_findings_count?: number | null
          significance_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "research_iteration_comparisons_iteration_1_id_fkey"
            columns: ["iteration_1_id"]
            isOneToOne: false
            referencedRelation: "deep_research_iterations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_iteration_comparisons_iteration_2_id_fkey"
            columns: ["iteration_2_id"]
            isOneToOne: false
            referencedRelation: "deep_research_iterations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_iteration_comparisons_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "deep_research_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "research_iteration_comparisons_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "v_research_dashboard"
            referencedColumns: ["job_id"]
          },
        ]
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
      user_organizations: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      mv_research_dashboard_stats: {
        Row: {
          active_jobs: number | null
          average_quality_score: number | null
          completed_jobs: number | null
          jobs_requiring_attention: number | null
          last_updated: string | null
          total_critical_alerts: number | null
          total_jobs: number | null
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
      user_organization_details: {
        Row: {
          industry: Database["public"]["Enums"]["industry_type"] | null
          joined_at: string | null
          logo_key: string | null
          membership_active: boolean | null
          organization_active: boolean | null
          organization_email: string | null
          organization_id: string | null
          organization_name: string | null
          role: string | null
          user_id: string | null
          website: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_research_dashboard: {
        Row: {
          active_critical_alerts: number | null
          company_name: string | null
          completed_at: string | null
          computed_risk_level: string | null
          created_at: string | null
          critical_alerts_count: number | null
          job_id: string | null
          job_type: string | null
          priority: string | null
          processing_time_seconds: number | null
          progress: number | null
          quality_score: number | null
          request_id: string | null
          requires_attention: boolean | null
          status: string | null
          total_alerts: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_research_jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_processing_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "deep_research_jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "recent_document_requests"
            referencedColumns: ["request_id"]
          },
        ]
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
      can_user_refresh_gst: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: boolean
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
      cleanup_expired_research_reports: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_requests: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_old_research_iterations: {
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
      compare_research_iterations: {
        Args: { iteration_1_id_param: string; iteration_2_id_param: string }
        Returns: string
      }
      complete_research_iteration: {
        Args: {
          confidence_score_param?: number
          data_quality_score_param?: number
          findings_param: Json
          iteration_id_param: string
          tokens_used_param?: number
        }
        Returns: undefined
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
      consolidate_research_findings: {
        Args: { consolidation_strategy_param?: string; job_id_param: string }
        Returns: string
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
      extract_credit_rating: {
        Args: { risk_analysis_data: Json }
        Returns: string
      }
      extract_epfo_compliance: {
        Args: { risk_analysis_data: Json }
        Returns: {
          rate: number
          status: string
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
      extract_gst_compliance: {
        Args: { risk_analysis_data: Json }
        Returns: {
          rate: number
          status: string
        }[]
      }
      extract_location_city: {
        Args: { extracted_data_json: Json }
        Returns: string
      }
      extract_location_state: {
        Args: { extracted_data_json: Json }
        Returns: string
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
      extract_sector: {
        Args: { extracted_data_json: Json }
        Returns: string
      }
      generate_conversation_title: {
        Args: { conversation_uuid: string }
        Returns: string
      }
      get_active_research_jobs: {
        Args: { user_id_param: string }
        Returns: {
          created_at: string
          id: string
          job_type: string
          progress: number
          request_id: string
          status: string
        }[]
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
      get_api_health_status: {
        Args: { p_hours?: number }
        Returns: {
          api_name: string
          avg_response_time_ms: number
          circuit_breaker_triggers: number
          failed_requests: number
          failure_rate: number
          last_failure: string
          total_requests: number
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
      get_data_quality_trends: {
        Args: { p_days?: number; p_user_id?: string }
        Returns: {
          avg_accuracy: number
          avg_completeness: number
          avg_overall_score: number
          avg_reliability: number
          date_bucket: string
          total_assessments: number
        }[]
      }
      get_deep_research_error_statistics: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id?: string }
        Returns: {
          average_resolution_time: unknown
          critical_errors: number
          fallback_success_rate: number
          most_common_category: string
          most_common_severity: string
          resolved_errors: number
          total_errors: number
        }[]
      }
      get_gst_filing_data: {
        Args: { p_financial_year?: string; p_gstin: string }
        Returns: {
          arn: string
          date_of_filing: string
          fetched_at: string
          filing_mode: string
          financial_year: string
          gstin: string
          is_valid: boolean
          return_period: string
          return_type: string
          status: string
        }[]
      }
      get_mca_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_multi_iteration_research_status: {
        Args: { job_id_param: string }
        Returns: {
          completed_iterations: number
          consolidation_status: string
          current_iteration: number
          job_id: string
          max_iterations: number
          overall_progress: number
          pending_iterations: number
        }[]
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
      get_user_gst_refresh_status: {
        Args: { p_request_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_primary_organization: {
        Args: { p_user_id: string }
        Returns: string
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
      increment_gst_refresh_count: {
        Args: { p_gstins: string[]; p_request_id: string; p_user_id: string }
        Returns: undefined
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
      is_gst_data_fresh: {
        Args: {
          p_financial_year: string
          p_gstin: string
          p_max_age_days?: number
        }
        Returns: boolean
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
      start_research_iteration: {
        Args: {
          iteration_number_param: number
          job_id_param: string
          research_focus_param?: Json
          research_type_param: string
        }
        Returns: string
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
      update_research_job_progress: {
        Args: {
          job_id_param: string
          progress_param: number
          status_param?: string
        }
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
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
      collection_feedback_type:
        | "Good"
        | "OK"
        | "Bad"
        | "No-Go"
        | "Credit Call"
        | "Business Call"
        | "No Business"
        | "Limited rotations"
      credit_type: "Secured" | "Unsecured" | "Secured+Unsecured"
      industry_type: "manufacturing" | "manufacturing-oem" | "epc"
      lpi_received_type: "NA" | "Yes" | "No"
      model_type: "with_banking" | "without_banking"
      processing_status:
        | "submitted"
        | "processing"
        | "completed"
        | "failed"
        | "upload_pending"
        | "created"
      repayment_type: "Before time" | "Timely" | "Slight Delay" | "Huge Delay"
      security_requirement_type: "CC" | "BG" | "Advance" | "Others"
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
      collection_feedback_type: [
        "Good",
        "OK",
        "Bad",
        "No-Go",
        "Credit Call",
        "Business Call",
        "No Business",
        "Limited rotations",
      ],
      credit_type: ["Secured", "Unsecured", "Secured+Unsecured"],
      industry_type: ["manufacturing", "manufacturing-oem", "epc"],
      lpi_received_type: ["NA", "Yes", "No"],
      model_type: ["with_banking", "without_banking"],
      processing_status: [
        "submitted",
        "processing",
        "completed",
        "failed",
        "upload_pending",
        "created",
      ],
      repayment_type: ["Before time", "Timely", "Slight Delay", "Huge Delay"],
      security_requirement_type: ["CC", "BG", "Advance", "Others"],
    },
  },
} as const
