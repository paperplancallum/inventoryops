export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action_type"]
          changes: Json
          correlation_id: string | null
          created_at: string
          entity_id: string
          entity_name: string
          entity_type: Database["public"]["Enums"]["activity_entity_type"]
          id: string
          ip_address: unknown
          is_system_action: boolean
          notes: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action_type"]
          changes?: Json
          correlation_id?: string | null
          created_at?: string
          entity_id: string
          entity_name: string
          entity_type: Database["public"]["Enums"]["activity_entity_type"]
          id?: string
          ip_address?: unknown
          is_system_action?: boolean
          notes?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action_type"]
          changes?: Json
          correlation_id?: string | null
          created_at?: string
          entity_id?: string
          entity_name?: string
          entity_type?: Database["public"]["Enums"]["activity_entity_type"]
          id?: string
          ip_address?: unknown
          is_system_action?: boolean
          notes?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      amazon_connections: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          client_id: string
          client_secret: string
          created_at: string
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          marketplaces: Database["public"]["Enums"]["amazon_marketplace"][]
          refresh_token: string
          seller_id: string
          seller_name: string | null
          status: Database["public"]["Enums"]["amazon_connection_status"]
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          marketplaces?: Database["public"]["Enums"]["amazon_marketplace"][]
          refresh_token: string
          seller_id: string
          seller_name?: string | null
          status?: Database["public"]["Enums"]["amazon_connection_status"]
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          marketplaces?: Database["public"]["Enums"]["amazon_marketplace"][]
          refresh_token?: string
          seller_id?: string
          seller_name?: string | null
          status?: Database["public"]["Enums"]["amazon_connection_status"]
          updated_at?: string
        }
        Relationships: []
      }
      amazon_inventory: {
        Row: {
          asin: string
          awd_inbound_quantity: number
          awd_quantity: number
          condition: Database["public"]["Enums"]["amazon_condition"]
          fba_fulfillable: number
          fba_inbound_receiving: number
          fba_inbound_shipped: number
          fba_inbound_working: number
          fba_reserved: number
          fba_unfulfillable: number
          fnsku: string | null
          id: string
          last_synced_at: string
          marketplace: Database["public"]["Enums"]["amazon_marketplace"]
          product_name: string
          seller_sku: string
        }
        Insert: {
          asin: string
          awd_inbound_quantity?: number
          awd_quantity?: number
          condition?: Database["public"]["Enums"]["amazon_condition"]
          fba_fulfillable?: number
          fba_inbound_receiving?: number
          fba_inbound_shipped?: number
          fba_inbound_working?: number
          fba_reserved?: number
          fba_unfulfillable?: number
          fnsku?: string | null
          id?: string
          last_synced_at?: string
          marketplace: Database["public"]["Enums"]["amazon_marketplace"]
          product_name: string
          seller_sku: string
        }
        Update: {
          asin?: string
          awd_inbound_quantity?: number
          awd_quantity?: number
          condition?: Database["public"]["Enums"]["amazon_condition"]
          fba_fulfillable?: number
          fba_inbound_receiving?: number
          fba_inbound_shipped?: number
          fba_inbound_working?: number
          fba_reserved?: number
          fba_unfulfillable?: number
          fnsku?: string | null
          id?: string
          last_synced_at?: string
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"]
          product_name?: string
          seller_sku?: string
        }
        Relationships: []
      }
      amazon_reconciliations: {
        Row: {
          adjustment_ledger_entry_id: string | null
          amazon_quantity: number
          batch_id: string | null
          discrepancy: number
          expected_quantity: number
          id: string
          notes: string | null
          product_name: string | null
          reconciled_at: string
          reconciled_by: string | null
          sku: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Insert: {
          adjustment_ledger_entry_id?: string | null
          amazon_quantity: number
          batch_id?: string | null
          discrepancy?: number
          expected_quantity: number
          id?: string
          notes?: string | null
          product_name?: string | null
          reconciled_at?: string
          reconciled_by?: string | null
          sku: string
          status: Database["public"]["Enums"]["reconciliation_status"]
        }
        Update: {
          adjustment_ledger_entry_id?: string | null
          amazon_quantity?: number
          batch_id?: string | null
          discrepancy?: number
          expected_quantity?: number
          id?: string
          notes?: string | null
          product_name?: string | null
          reconciled_at?: string
          reconciled_by?: string | null
          sku?: string
          status?: Database["public"]["Enums"]["reconciliation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "amazon_reconciliations_adjustment_ledger_entry_id_fkey"
            columns: ["adjustment_ledger_entry_id"]
            isOneToOne: false
            referencedRelation: "stock_ledger_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_reconciliations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_reconciliations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      amazon_shipment_items: {
        Row: {
          amazon_shipment_id: string
          asin: string | null
          created_at: string
          fn_sku: string
          id: string
          prep_details: string[] | null
          product_name: string
          quantity_in_case: number | null
          quantity_received: number
          quantity_shipped: number
          seller_sku: string
          updated_at: string
        }
        Insert: {
          amazon_shipment_id: string
          asin?: string | null
          created_at?: string
          fn_sku: string
          id?: string
          prep_details?: string[] | null
          product_name: string
          quantity_in_case?: number | null
          quantity_received?: number
          quantity_shipped?: number
          seller_sku: string
          updated_at?: string
        }
        Update: {
          amazon_shipment_id?: string
          asin?: string | null
          created_at?: string
          fn_sku?: string
          id?: string
          prep_details?: string[] | null
          product_name?: string
          quantity_in_case?: number | null
          quantity_received?: number
          quantity_shipped?: number
          seller_sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amazon_shipment_items_amazon_shipment_id_fkey"
            columns: ["amazon_shipment_id"]
            isOneToOne: false
            referencedRelation: "amazon_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_shipments: {
        Row: {
          are_cases_required: boolean | null
          box_count: number | null
          carrier_name: string | null
          created_at: string
          created_date: string
          delivery_window_end: string | null
          delivery_window_start: string | null
          destination_address_city: string | null
          destination_address_country: string | null
          destination_address_line1: string | null
          destination_address_name: string | null
          destination_address_postal_code: string | null
          destination_address_state: string | null
          destination_fc_id: string
          estimated_box_contents_fee: number | null
          freight_ready_date: string | null
          id: string
          inbound_type: Database["public"]["Enums"]["amazon_inbound_type"]
          labels_prep_type: string | null
          last_synced_at: string
          last_updated_date: string
          linked_transfer_id: string | null
          shipment_confirmation_id: string | null
          shipment_id: string
          shipment_name: string
          shipment_type:
            | Database["public"]["Enums"]["amazon_shipment_type"]
            | null
          status: Database["public"]["Enums"]["amazon_shipment_status"]
          total_skus: number
          total_units: number
          tracking_ids: string[] | null
          updated_at: string
        }
        Insert: {
          are_cases_required?: boolean | null
          box_count?: number | null
          carrier_name?: string | null
          created_at?: string
          created_date: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          destination_address_city?: string | null
          destination_address_country?: string | null
          destination_address_line1?: string | null
          destination_address_name?: string | null
          destination_address_postal_code?: string | null
          destination_address_state?: string | null
          destination_fc_id: string
          estimated_box_contents_fee?: number | null
          freight_ready_date?: string | null
          id?: string
          inbound_type?: Database["public"]["Enums"]["amazon_inbound_type"]
          labels_prep_type?: string | null
          last_synced_at?: string
          last_updated_date: string
          linked_transfer_id?: string | null
          shipment_confirmation_id?: string | null
          shipment_id: string
          shipment_name: string
          shipment_type?:
            | Database["public"]["Enums"]["amazon_shipment_type"]
            | null
          status: Database["public"]["Enums"]["amazon_shipment_status"]
          total_skus?: number
          total_units?: number
          tracking_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          are_cases_required?: boolean | null
          box_count?: number | null
          carrier_name?: string | null
          created_at?: string
          created_date?: string
          delivery_window_end?: string | null
          delivery_window_start?: string | null
          destination_address_city?: string | null
          destination_address_country?: string | null
          destination_address_line1?: string | null
          destination_address_name?: string | null
          destination_address_postal_code?: string | null
          destination_address_state?: string | null
          destination_fc_id?: string
          estimated_box_contents_fee?: number | null
          freight_ready_date?: string | null
          id?: string
          inbound_type?: Database["public"]["Enums"]["amazon_inbound_type"]
          labels_prep_type?: string | null
          last_synced_at?: string
          last_updated_date?: string
          linked_transfer_id?: string | null
          shipment_confirmation_id?: string | null
          shipment_id?: string
          shipment_name?: string
          shipment_type?:
            | Database["public"]["Enums"]["amazon_shipment_type"]
            | null
          status?: Database["public"]["Enums"]["amazon_shipment_status"]
          total_skus?: number
          total_units?: number
          tracking_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amazon_shipments_linked_transfer_id_fkey"
            columns: ["linked_transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "amazon_shipments_linked_transfer_id_fkey"
            columns: ["linked_transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_shipments_linked_transfer_id_fkey"
            columns: ["linked_transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_sku_mappings: {
        Row: {
          amazon_seller_sku: string
          asin: string
          created_at: string
          created_by: string
          fnsku: string | null
          id: string
          internal_product_id: string | null
          internal_sku_id: string | null
        }
        Insert: {
          amazon_seller_sku: string
          asin: string
          created_at?: string
          created_by?: string
          fnsku?: string | null
          id?: string
          internal_product_id?: string | null
          internal_sku_id?: string | null
        }
        Update: {
          amazon_seller_sku?: string
          asin?: string
          created_at?: string
          created_by?: string
          fnsku?: string | null
          id?: string
          internal_product_id?: string | null
          internal_sku_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_sku_mappings_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_sku_mappings_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_sku_mappings_internal_sku_id_fkey"
            columns: ["internal_sku_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_attachments: {
        Row: {
          batch_id: string
          created_at: string
          id: string
          name: string
          size: number | null
          storage_path: string | null
          type: string
          uploaded_by_id: string | null
          uploaded_by_name: string | null
          url: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          id?: string
          name: string
          size?: number | null
          storage_path?: string | null
          type: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
          url: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          id?: string
          name?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_attachments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_attachments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      batch_stage_history: {
        Row: {
          batch_id: string
          changed_by_id: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          note: string | null
          stage: Database["public"]["Enums"]["batch_stage"]
        }
        Insert: {
          batch_id: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          stage: Database["public"]["Enums"]["batch_stage"]
        }
        Update: {
          batch_id?: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          stage?: Database["public"]["Enums"]["batch_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "batch_stage_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_stage_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      batches: {
        Row: {
          actual_arrival: string | null
          batch_number: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          expected_arrival: string | null
          id: string
          notes: string | null
          ordered_date: string
          po_id: string | null
          po_line_item_id: string | null
          product_id: string | null
          product_name: string
          quantity: number
          shipment_id: string | null
          sku: string
          stage: Database["public"]["Enums"]["batch_stage"]
          supplier_id: string | null
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          actual_arrival?: string | null
          batch_number?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_arrival?: string | null
          id?: string
          notes?: string | null
          ordered_date?: string
          po_id?: string | null
          po_line_item_id?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          shipment_id?: string | null
          sku: string
          stage?: Database["public"]["Enums"]["batch_stage"]
          supplier_id?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          actual_arrival?: string | null
          batch_number?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_arrival?: string | null
          id?: string
          notes?: string | null
          ordered_date?: string
          po_id?: string | null
          po_line_item_id?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          shipment_id?: string | null
          sku?: string
          stage?: Database["public"]["Enums"]["batch_stage"]
          supplier_id?: string | null
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_po_line_item_id_fkey"
            columns: ["po_line_item_id"]
            isOneToOne: false
            referencedRelation: "po_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_expense_items: {
        Row: {
          amount: number
          bom_id: string
          created_at: string
          description: string | null
          id: string
          is_per_unit: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amount?: number
          bom_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_per_unit?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          bom_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_per_unit?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_expense_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "active_boms_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_expense_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_history: {
        Row: {
          bom_id: string
          change_description: string
          changed_by_id: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          line_items_snapshot: Json
          version: string
        }
        Insert: {
          bom_id: string
          change_description: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          line_items_snapshot: Json
          version: string
        }
        Update: {
          bom_id?: string
          change_description?: string
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          line_items_snapshot?: Json
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_history_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "active_boms_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_history_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
        ]
      }
      bom_line_items: {
        Row: {
          bom_id: string
          component_product_id: string
          created_at: string
          id: string
          position_notes: string | null
          quantity_required: number
          sort_order: number
          uom: string
          updated_at: string
        }
        Insert: {
          bom_id: string
          component_product_id: string
          created_at?: string
          id?: string
          position_notes?: string | null
          quantity_required: number
          sort_order?: number
          uom?: string
          updated_at?: string
        }
        Update: {
          bom_id?: string
          component_product_id?: string
          created_at?: string
          id?: string
          position_notes?: string | null
          quantity_required?: number
          sort_order?: number
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_line_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "active_boms_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_line_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_line_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "bom_line_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      boms: {
        Row: {
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          expected_scrap_percent: number
          finished_product_id: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          output_quantity: number
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_scrap_percent?: number
          finished_product_id: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          output_quantity?: number
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_scrap_percent?: number
          finished_product_id?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          output_quantity?: number
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          status: Database["public"]["Enums"]["brand_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          status?: Database["public"]["Enums"]["brand_status"]
          updated_at?: string
        }
        Relationships: []
      }
      inspection_agents: {
        Row: {
          company: string | null
          created_at: string | null
          custom_payment_milestones: Json | null
          email: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          payment_terms: string | null
          payment_terms_template_id: string | null
          phone: string | null
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          custom_payment_milestones?: Json | null
          email: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          custom_payment_milestones?: Json | null
          email?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_agents_payment_terms_template_id_fkey"
            columns: ["payment_terms_template_id"]
            isOneToOne: false
            referencedRelation: "payment_terms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_defects: {
        Row: {
          created_at: string | null
          description: string
          id: string
          inspection_line_item_id: string
          quantity: number | null
          severity: Database["public"]["Enums"]["defect_severity"] | null
          type: Database["public"]["Enums"]["defect_type"]
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          inspection_line_item_id: string
          quantity?: number | null
          severity?: Database["public"]["Enums"]["defect_severity"] | null
          type: Database["public"]["Enums"]["defect_type"]
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          inspection_line_item_id?: string
          quantity?: number | null
          severity?: Database["public"]["Enums"]["defect_severity"] | null
          type?: Database["public"]["Enums"]["defect_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inspection_defects_inspection_line_item_id_fkey"
            columns: ["inspection_line_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_line_items: {
        Row: {
          barcode_scans: boolean | null
          box_condition: Database["public"]["Enums"]["box_condition"] | null
          created_at: string | null
          defect_rate: number | null
          defects_found: number | null
          id: string
          inspection_id: string
          labeling_accuracy: boolean | null
          ordered_quantity: number
          packaging_notes: string | null
          po_line_item_id: string | null
          product_id: string | null
          product_name: string
          product_sku: string
          result: Database["public"]["Enums"]["line_item_result"] | null
          sample_size: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          barcode_scans?: boolean | null
          box_condition?: Database["public"]["Enums"]["box_condition"] | null
          created_at?: string | null
          defect_rate?: number | null
          defects_found?: number | null
          id?: string
          inspection_id: string
          labeling_accuracy?: boolean | null
          ordered_quantity: number
          packaging_notes?: string | null
          po_line_item_id?: string | null
          product_id?: string | null
          product_name: string
          product_sku: string
          result?: Database["public"]["Enums"]["line_item_result"] | null
          sample_size?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          barcode_scans?: boolean | null
          box_condition?: Database["public"]["Enums"]["box_condition"] | null
          created_at?: string | null
          defect_rate?: number | null
          defects_found?: number | null
          id?: string
          inspection_id?: string
          labeling_accuracy?: boolean | null
          ordered_quantity?: number
          packaging_notes?: string | null
          po_line_item_id?: string | null
          product_id?: string | null
          product_name?: string
          product_sku?: string
          result?: Database["public"]["Enums"]["line_item_result"] | null
          sample_size?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_line_items_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_line_items_po_line_item_id_fkey"
            columns: ["po_line_item_id"]
            isOneToOne: false
            referencedRelation: "po_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "inspection_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_measurements: {
        Row: {
          actual_value: string | null
          created_at: string | null
          id: string
          inspection_line_item_id: string
          name: string
          passed: boolean | null
          spec_value: string
        }
        Insert: {
          actual_value?: string | null
          created_at?: string | null
          id?: string
          inspection_line_item_id: string
          name: string
          passed?: boolean | null
          spec_value: string
        }
        Update: {
          actual_value?: string | null
          created_at?: string | null
          id?: string
          inspection_line_item_id?: string
          name?: string
          passed?: boolean | null
          spec_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_measurements_inspection_line_item_id_fkey"
            columns: ["inspection_line_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_message_attachments: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          name: string
          size: number | null
          storage_path: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          name: string
          size?: number | null
          storage_path?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          name?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "inspection_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_messages: {
        Row: {
          content: string
          created_at: string | null
          direction: Database["public"]["Enums"]["inspection_message_direction"]
          id: string
          inspection_id: string
          sender_email: string | null
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          direction: Database["public"]["Enums"]["inspection_message_direction"]
          id?: string
          inspection_id: string
          sender_email?: string | null
          sender_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          direction?: Database["public"]["Enums"]["inspection_message_direction"]
          id?: string
          inspection_id?: string
          sender_email?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_messages_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          defect_id: string | null
          id: string
          inspection_id: string
          inspection_line_item_id: string | null
          storage_path: string | null
          type: Database["public"]["Enums"]["inspection_photo_type"] | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          defect_id?: string | null
          id?: string
          inspection_id: string
          inspection_line_item_id?: string | null
          storage_path?: string | null
          type?: Database["public"]["Enums"]["inspection_photo_type"] | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          defect_id?: string | null
          id?: string
          inspection_id?: string
          inspection_line_item_id?: string | null
          storage_path?: string | null
          type?: Database["public"]["Enums"]["inspection_photo_type"] | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_defect_id_fkey"
            columns: ["defect_id"]
            isOneToOne: false
            referencedRelation: "inspection_defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_inspection_line_item_id_fkey"
            columns: ["inspection_line_item_id"]
            isOneToOne: false
            referencedRelation: "inspection_line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_purchase_orders: {
        Row: {
          created_at: string | null
          id: string
          inspection_id: string
          purchase_order_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          inspection_id: string
          purchase_order_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          inspection_id?: string
          purchase_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_purchase_orders_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_purchase_orders_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          completed_date: string | null
          confirmed_date: string | null
          created_at: string | null
          id: string
          inspection_number: string | null
          invoice_amount: number | null
          invoice_id: string | null
          magic_link_expires_at: string | null
          magic_link_token: string | null
          notes: string | null
          original_inspection_id: string | null
          overall_defect_rate: number | null
          purchase_order_id: string | null
          purchase_order_number: string | null
          result: Database["public"]["Enums"]["line_item_result"] | null
          scheduled_date: string
          status: Database["public"]["Enums"]["inspection_status"] | null
          supplier_name: string | null
          total_sample_size: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          completed_date?: string | null
          confirmed_date?: string | null
          created_at?: string | null
          id?: string
          inspection_number?: string | null
          invoice_amount?: number | null
          invoice_id?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          notes?: string | null
          original_inspection_id?: string | null
          overall_defect_rate?: number | null
          purchase_order_id?: string | null
          purchase_order_number?: string | null
          result?: Database["public"]["Enums"]["line_item_result"] | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["inspection_status"] | null
          supplier_name?: string | null
          total_sample_size?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          completed_date?: string | null
          confirmed_date?: string | null
          created_at?: string | null
          id?: string
          inspection_number?: string | null
          invoice_amount?: number | null
          invoice_id?: string | null
          magic_link_expires_at?: string | null
          magic_link_token?: string | null
          notes?: string | null
          original_inspection_id?: string | null
          overall_defect_rate?: number | null
          purchase_order_id?: string | null
          purchase_order_number?: string | null
          result?: Database["public"]["Enums"]["line_item_result"] | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["inspection_status"] | null
          supplier_name?: string | null
          total_sample_size?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "inspection_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_original_inspection_id_fkey"
            columns: ["original_inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_attachments: {
        Row: {
          created_at: string
          id: string
          name: string
          payment_id: string
          size: number | null
          storage_path: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          payment_id: string
          size?: number | null
          storage_path?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          payment_id?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_attachments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "invoice_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payment_schedule_items: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          invoice_id: string
          milestone_name: string
          offset_days: number
          paid_amount: number
          paid_date: string | null
          percentage: number
          sort_order: number
          trigger: Database["public"]["Enums"]["payment_milestone_trigger"]
          trigger_date: string | null
          trigger_status: Database["public"]["Enums"]["payment_trigger_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_id: string
          milestone_name: string
          offset_days?: number
          paid_amount?: number
          paid_date?: string | null
          percentage: number
          sort_order?: number
          trigger: Database["public"]["Enums"]["payment_milestone_trigger"]
          trigger_date?: string | null
          trigger_status?: Database["public"]["Enums"]["payment_trigger_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_id?: string
          milestone_name?: string
          offset_days?: number
          paid_amount?: number
          paid_date?: string | null
          percentage?: number
          sort_order?: number
          trigger?: Database["public"]["Enums"]["payment_milestone_trigger"]
          trigger_date?: string | null
          trigger_status?: Database["public"]["Enums"]["payment_trigger_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payment_schedule_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          reference: string
          schedule_item_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          reference: string
          schedule_item_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          reference?: string
          schedule_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_schedule_item_id_fkey"
            columns: ["schedule_item_id"]
            isOneToOne: false
            referencedRelation: "invoice_payment_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          balance: number
          brand_id: string | null
          brand_name: string | null
          created_at: string
          creation_method: Database["public"]["Enums"]["invoice_creation_method"]
          description: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          linked_entity_id: string
          linked_entity_name: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          notes: string | null
          paid_amount: number
          payment_terms_template_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          balance?: number
          brand_id?: string | null
          brand_name?: string | null
          created_at?: string
          creation_method?: Database["public"]["Enums"]["invoice_creation_method"]
          description: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          linked_entity_id: string
          linked_entity_name: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          notes?: string | null
          paid_amount?: number
          payment_terms_template_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number
          brand_id?: string | null
          brand_name?: string | null
          created_at?: string
          creation_method?: Database["public"]["Enums"]["invoice_creation_method"]
          description?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          linked_entity_id?: string
          linked_entity_name?: string
          linked_entity_type?: Database["public"]["Enums"]["linked_entity_type"]
          notes?: string | null
          paid_amount?: number
          payment_terms_template_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_terms_template_id_fkey"
            columns: ["payment_terms_template_id"]
            isOneToOne: false
            referencedRelation: "payment_terms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          postal_code: string | null
          state_province: string | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          postal_code?: string | null
          state_province?: string | null
          type: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          postal_code?: string | null
          state_province?: string | null
          type?: Database["public"]["Enums"]["location_type"]
          updated_at?: string
        }
        Relationships: []
      }
      magic_link_events: {
        Row: {
          event_type: Database["public"]["Enums"]["magic_link_event_type"]
          id: string
          ip_address: string | null
          magic_link_id: string
          metadata: Json | null
          timestamp: string
          triggered_by_user_id: string | null
          triggered_by_user_name: string | null
          user_agent: string | null
        }
        Insert: {
          event_type: Database["public"]["Enums"]["magic_link_event_type"]
          id?: string
          ip_address?: string | null
          magic_link_id: string
          metadata?: Json | null
          timestamp?: string
          triggered_by_user_id?: string | null
          triggered_by_user_name?: string | null
          user_agent?: string | null
        }
        Update: {
          event_type?: Database["public"]["Enums"]["magic_link_event_type"]
          id?: string
          ip_address?: string | null
          magic_link_id?: string
          metadata?: Json | null
          timestamp?: string
          triggered_by_user_id?: string | null
          triggered_by_user_name?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_link_events_magic_link_id_fkey"
            columns: ["magic_link_id"]
            isOneToOne: false
            referencedRelation: "magic_links"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string
          created_by_user_id: string | null
          created_by_user_name: string | null
          custom_message: string | null
          expires_at: string
          first_viewed_at: string | null
          id: string
          linked_entity_id: string
          linked_entity_name: string
          linked_entity_type: Database["public"]["Enums"]["magic_link_entity_type"]
          notes: string | null
          purpose: Database["public"]["Enums"]["magic_link_purpose"]
          recipient_email: string
          recipient_name: string
          recipient_role: string
          regenerated_from_id: string | null
          revoked_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["magic_link_status"]
          submission_data: Json | null
          submitted_at: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_user_id?: string | null
          created_by_user_name?: string | null
          custom_message?: string | null
          expires_at: string
          first_viewed_at?: string | null
          id?: string
          linked_entity_id: string
          linked_entity_name: string
          linked_entity_type: Database["public"]["Enums"]["magic_link_entity_type"]
          notes?: string | null
          purpose: Database["public"]["Enums"]["magic_link_purpose"]
          recipient_email: string
          recipient_name: string
          recipient_role?: string
          regenerated_from_id?: string | null
          revoked_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["magic_link_status"]
          submission_data?: Json | null
          submitted_at?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_user_id?: string | null
          created_by_user_name?: string | null
          custom_message?: string | null
          expires_at?: string
          first_viewed_at?: string | null
          id?: string
          linked_entity_id?: string
          linked_entity_name?: string
          linked_entity_type?: Database["public"]["Enums"]["magic_link_entity_type"]
          notes?: string | null
          purpose?: Database["public"]["Enums"]["magic_link_purpose"]
          recipient_email?: string
          recipient_name?: string
          recipient_role?: string
          regenerated_from_id?: string | null
          revoked_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["magic_link_status"]
          submission_data?: Json | null
          submitted_at?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_regenerated_from_id_fkey"
            columns: ["regenerated_from_id"]
            isOneToOne: false
            referencedRelation: "magic_links"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          asin: string
          created_at: string
          fnsku: string | null
          id: string
          is_active: boolean
          marketplace: string
          product_sku_id: string
        }
        Insert: {
          asin: string
          created_at?: string
          fnsku?: string | null
          id?: string
          is_active?: boolean
          marketplace: string
          product_sku_id: string
        }
        Update: {
          asin?: string
          created_at?: string
          fnsku?: string | null
          id?: string
          is_active?: boolean
          marketplace?: string
          product_sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_product_sku_id_fkey"
            columns: ["product_sku_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_terms_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          milestones: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          milestones?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          milestones?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      po_attachments: {
        Row: {
          created_at: string
          id: string
          message_id: string
          name: string
          size: number | null
          storage_path: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          name: string
          size?: number | null
          storage_path?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          name?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "po_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      po_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          generated_by_id: string | null
          generated_by_name: string | null
          id: string
          purchase_order_id: string
          snapshot_data: Json | null
          storage_path: string | null
          version: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          generated_by_id?: string | null
          generated_by_name?: string | null
          id?: string
          purchase_order_id: string
          snapshot_data?: Json | null
          storage_path?: string | null
          version?: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          generated_by_id?: string | null
          generated_by_name?: string | null
          id?: string
          purchase_order_id?: string
          snapshot_data?: Json | null
          storage_path?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_documents_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_line_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_name: string
          purchase_order_id: string
          quantity: number
          sku: string
          sort_order: number
          subtotal: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name: string
          purchase_order_id: string
          quantity: number
          sku: string
          sort_order?: number
          subtotal?: number
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          sku?: string
          sort_order?: number
          subtotal?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "po_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_messages: {
        Row: {
          content: string
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          is_cleared: boolean
          is_read: boolean
          purchase_order_id: string
          sender_email: string | null
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          purchase_order_id: string
          sender_email?: string | null
          sender_name: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          purchase_order_id?: string
          sender_email?: string | null
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_messages_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_status_history: {
        Row: {
          changed_by_id: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          note: string | null
          purchase_order_id: string
          status: Database["public"]["Enums"]["po_status"]
        }
        Insert: {
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          purchase_order_id: string
          status: Database["public"]["Enums"]["po_status"]
        }
        Update: {
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          purchase_order_id?: string
          status?: Database["public"]["Enums"]["po_status"]
        }
        Relationships: [
          {
            foreignKeyName: "po_status_history_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_skus: {
        Row: {
          asin: string | null
          condition: Database["public"]["Enums"]["sku_condition"]
          created_at: string
          ean: string | null
          fnsku: string | null
          id: string
          is_default: boolean
          notes: string | null
          product_id: string
          sku: string
          upc: string | null
          updated_at: string
        }
        Insert: {
          asin?: string | null
          condition?: Database["public"]["Enums"]["sku_condition"]
          created_at?: string
          ean?: string | null
          fnsku?: string | null
          id?: string
          is_default?: boolean
          notes?: string | null
          product_id: string
          sku: string
          upc?: string | null
          updated_at?: string
        }
        Update: {
          asin?: string | null
          condition?: Database["public"]["Enums"]["sku_condition"]
          created_at?: string
          ean?: string | null
          fnsku?: string | null
          id?: string
          is_default?: boolean
          notes?: string | null
          product_id?: string
          sku?: string
          upc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_skus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "product_skus_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_spec_sheets: {
        Row: {
          file_name: string
          file_size: number
          file_url: string
          id: string
          notes: string | null
          product_id: string
          storage_path: string | null
          uploaded_at: string
          uploaded_by_id: string | null
          uploaded_by_name: string | null
          version: string
        }
        Insert: {
          file_name: string
          file_size: number
          file_url: string
          id?: string
          notes?: string | null
          product_id: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
          version?: string
        }
        Update: {
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          notes?: string | null
          product_id?: string
          storage_path?: string | null
          uploaded_at?: string
          uploaded_by_id?: string | null
          uploaded_by_name?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_spec_sheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "product_spec_sheets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          asin: string | null
          brand_id: string | null
          category: string | null
          created_at: string
          description: string | null
          fnsku: string | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          sku: string
          status: Database["public"]["Enums"]["product_status"]
          supplier_id: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          asin?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          fnsku?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sku: string
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          asin?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          fnsku?: string | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sku?: string
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_fk"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          expected_date: string | null
          id: string
          inspection_id: string | null
          inspection_status:
            | Database["public"]["Enums"]["inspection_decision_status"]
            | null
          invoice_link_sent_at: string | null
          invoice_received_at: string | null
          invoice_reviewed_at: string | null
          invoice_submitted_at: string | null
          invoice_variance: number | null
          invoice_variance_percent: number | null
          notes: string | null
          order_date: string
          payment_terms: string | null
          payment_terms_template_id: string | null
          po_number: string
          received_date: string | null
          requires_inspection: boolean | null
          sent_to_supplier_at: string | null
          status: Database["public"]["Enums"]["po_status"]
          subtotal: number
          supplier_id: string
          supplier_invoice_id: string | null
          supplier_invoice_status:
            | Database["public"]["Enums"]["supplier_invoice_status"]
            | null
          total: number
          unread_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_date?: string | null
          id?: string
          inspection_id?: string | null
          inspection_status?:
            | Database["public"]["Enums"]["inspection_decision_status"]
            | null
          invoice_link_sent_at?: string | null
          invoice_received_at?: string | null
          invoice_reviewed_at?: string | null
          invoice_submitted_at?: string | null
          invoice_variance?: number | null
          invoice_variance_percent?: number | null
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          po_number?: string
          received_date?: string | null
          requires_inspection?: boolean | null
          sent_to_supplier_at?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id: string
          supplier_invoice_id?: string | null
          supplier_invoice_status?:
            | Database["public"]["Enums"]["supplier_invoice_status"]
            | null
          total?: number
          unread_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          expected_date?: string | null
          id?: string
          inspection_id?: string | null
          inspection_status?:
            | Database["public"]["Enums"]["inspection_decision_status"]
            | null
          invoice_link_sent_at?: string | null
          invoice_received_at?: string | null
          invoice_reviewed_at?: string | null
          invoice_submitted_at?: string | null
          invoice_variance?: number | null
          invoice_variance_percent?: number | null
          notes?: string | null
          order_date?: string
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          po_number?: string
          received_date?: string | null
          requires_inspection?: boolean | null
          sent_to_supplier_at?: string | null
          status?: Database["public"]["Enums"]["po_status"]
          subtotal?: number
          supplier_id?: string
          supplier_invoice_id?: string | null
          supplier_invoice_status?:
            | Database["public"]["Enums"]["supplier_invoice_status"]
            | null
          total?: number
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_payment_terms_template_id_fkey"
            columns: ["payment_terms_template_id"]
            isOneToOne: false
            referencedRelation: "payment_terms_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rework_requests: {
        Row: {
          completed_date: string | null
          created_at: string | null
          created_date: string | null
          id: string
          inspection_id: string
          instructions: string
          status: Database["public"]["Enums"]["rework_status"] | null
          supplier_response: string | null
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          created_date?: string | null
          id?: string
          inspection_id: string
          instructions: string
          status?: Database["public"]["Enums"]["rework_status"] | null
          supplier_response?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          created_date?: string | null
          id?: string
          inspection_id?: string
          instructions?: string
          status?: Database["public"]["Enums"]["rework_status"] | null
          supplier_response?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rework_requests_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_agent_message_attachments: {
        Row: {
          created_at: string
          id: string
          message_id: string
          name: string
          size: number | null
          storage_path: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          name: string
          size?: number | null
          storage_path?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          name?: string
          size?: number | null
          storage_path?: string | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_agent_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "shipping_agent_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_agent_messages: {
        Row: {
          content: string
          created_at: string
          direction: string
          id: string
          is_cleared: boolean
          is_read: boolean
          sender_email: string | null
          sender_name: string
          shipping_agent_id: string
          transfer_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          direction: string
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          sender_email?: string | null
          sender_name: string
          shipping_agent_id: string
          transfer_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          is_cleared?: boolean
          is_read?: boolean
          sender_email?: string | null
          sender_name?: string
          shipping_agent_id?: string
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_agent_messages_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_agent_messages_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "shipping_agent_messages_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_agent_messages_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_agents: {
        Row: {
          account_number: string | null
          address_city: string
          address_country: string
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          contact_name: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          payment_terms_template_id: string | null
          phone: string
          services: Database["public"]["Enums"]["shipping_service"][]
          unread_count: number
          updated_at: string
          website: string | null
        }
        Insert: {
          account_number?: string | null
          address_city: string
          address_country: string
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          contact_name: string
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          phone: string
          services?: Database["public"]["Enums"]["shipping_service"][]
          unread_count?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_number?: string | null
          address_city?: string
          address_country?: string
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          phone?: string
          services?: Database["public"]["Enums"]["shipping_service"][]
          unread_count?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_agents_payment_terms_template_id_fkey"
            columns: ["payment_terms_template_id"]
            isOneToOne: false
            referencedRelation: "payment_terms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_invoice_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          shipping_invoice_id: string
          sort_order: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          shipping_invoice_id: string
          sort_order?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          shipping_invoice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_invoice_line_items_shipping_invoice_id_fkey"
            columns: ["shipping_invoice_id"]
            isOneToOne: false
            referencedRelation: "shipping_invoice_with_variance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_invoice_line_items_shipping_invoice_id_fkey"
            columns: ["shipping_invoice_id"]
            isOneToOne: false
            referencedRelation: "shipping_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_invoices: {
        Row: {
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          pdf_path: string | null
          shipping_quote_id: string
          status: Database["public"]["Enums"]["shipping_invoice_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          pdf_path?: string | null
          shipping_quote_id: string
          status?: Database["public"]["Enums"]["shipping_invoice_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          pdf_path?: string | null
          shipping_quote_id?: string
          status?: Database["public"]["Enums"]["shipping_invoice_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_invoices_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shipping_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_quote_line_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          shipping_quote_id: string
          sort_order: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          shipping_quote_id: string
          sort_order?: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          shipping_quote_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quote_line_items_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shipping_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_quote_transfers: {
        Row: {
          created_at: string
          shipping_quote_id: string
          transfer_id: string
        }
        Insert: {
          created_at?: string
          shipping_quote_id: string
          transfer_id: string
        }
        Update: {
          created_at?: string
          shipping_quote_id?: string
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quote_transfers_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shipping_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_quote_transfers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "shipping_quote_transfers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_quote_transfers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_quotes: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          magic_link_token: string | null
          notes: string | null
          pdf_path: string | null
          shipping_agent_id: string
          status: Database["public"]["Enums"]["shipping_quote_status"]
          submitted_at: string | null
          token_expires_at: string | null
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          magic_link_token?: string | null
          notes?: string | null
          pdf_path?: string | null
          shipping_agent_id: string
          status?: Database["public"]["Enums"]["shipping_quote_status"]
          submitted_at?: string | null
          token_expires_at?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          magic_link_token?: string | null
          notes?: string | null
          pdf_path?: string | null
          shipping_agent_id?: string
          status?: Database["public"]["Enums"]["shipping_quote_status"]
          submitted_at?: string | null
          token_expires_at?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_quotes_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_ledger_entries: {
        Row: {
          batch_id: string
          created_at: string
          created_by: string
          id: string
          location_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes: string | null
          product_name: string
          quantity: number
          reason: string
          sku: string
          total_cost: number
          transfer_id: string | null
          transfer_line_item_id: string | null
          unit_cost: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          created_by?: string
          id?: string
          location_id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_name: string
          quantity: number
          reason: string
          sku: string
          total_cost?: number
          transfer_id?: string | null
          transfer_line_item_id?: string | null
          unit_cost?: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          created_by?: string
          id?: string
          location_id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          notes?: string | null
          product_name?: string
          quantity?: number
          reason?: string
          sku?: string
          total_cost?: number
          transfer_id?: string | null
          transfer_line_item_id?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_ledger_transfer"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "fk_stock_ledger_transfer"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_ledger_transfer"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_ledger_transfer_line_item"
            columns: ["transfer_line_item_id"]
            isOneToOne: false
            referencedRelation: "transfer_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_submission_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          submission_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          submission_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          submission_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_submission_attachments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_submission_costs: {
        Row: {
          amount: number
          approved_amount: number | null
          cost_type: Database["public"]["Enums"]["supplier_additional_cost_type"]
          created_at: string
          description: string
          id: string
          is_approved: boolean | null
          sort_order: number
          submission_id: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          cost_type: Database["public"]["Enums"]["supplier_additional_cost_type"]
          created_at?: string
          description: string
          id?: string
          is_approved?: boolean | null
          sort_order?: number
          submission_id: string
        }
        Update: {
          amount?: number
          approved_amount?: number | null
          cost_type?: Database["public"]["Enums"]["supplier_additional_cost_type"]
          created_at?: string
          description?: string
          id?: string
          is_approved?: boolean | null
          sort_order?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_submission_costs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_submission_line_items: {
        Row: {
          approved_unit_cost: number | null
          created_at: string
          expected_line_total: number | null
          expected_unit_cost: number
          id: string
          is_approved: boolean | null
          notes: string | null
          po_line_item_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string
          sort_order: number
          submission_id: string
          submitted_line_total: number | null
          submitted_unit_cost: number
          variance_amount: number | null
        }
        Insert: {
          approved_unit_cost?: number | null
          created_at?: string
          expected_line_total?: number | null
          expected_unit_cost: number
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          po_line_item_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku: string
          sort_order?: number
          submission_id: string
          submitted_line_total?: number | null
          submitted_unit_cost: number
          variance_amount?: number | null
        }
        Update: {
          approved_unit_cost?: number | null
          created_at?: string
          expected_line_total?: number | null
          expected_unit_cost?: number
          id?: string
          is_approved?: boolean | null
          notes?: string | null
          po_line_item_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string
          sort_order?: number
          submission_id?: string
          submitted_line_total?: number | null
          submitted_unit_cost?: number
          variance_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_submission_line_items_po_line_item_id_fkey"
            columns: ["po_line_item_id"]
            isOneToOne: false
            referencedRelation: "po_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_submission_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "supplier_invoice_submission_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_submission_line_items_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_invoice_submissions: {
        Row: {
          created_at: string
          expected_total: number
          id: string
          magic_link_id: string
          po_number: string
          previous_submission_id: string | null
          purchase_order_id: string
          review_notes: string | null
          review_status: Database["public"]["Enums"]["supplier_submission_review_status"]
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          reviewed_by_user_name: string | null
          revision_number: number
          submitted_at: string
          submitted_by_email: string
          submitted_by_name: string
          submitted_total: number
          supplier_id: string | null
          supplier_name: string
          supplier_notes: string | null
          updated_at: string
          variance_amount: number | null
          variance_percentage: number | null
        }
        Insert: {
          created_at?: string
          expected_total?: number
          id?: string
          magic_link_id: string
          po_number: string
          previous_submission_id?: string | null
          purchase_order_id: string
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["supplier_submission_review_status"]
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          reviewed_by_user_name?: string | null
          revision_number?: number
          submitted_at?: string
          submitted_by_email: string
          submitted_by_name: string
          submitted_total?: number
          supplier_id?: string | null
          supplier_name: string
          supplier_notes?: string | null
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Update: {
          created_at?: string
          expected_total?: number
          id?: string
          magic_link_id?: string
          po_number?: string
          previous_submission_id?: string | null
          purchase_order_id?: string
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["supplier_submission_review_status"]
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          reviewed_by_user_name?: string | null
          revision_number?: number
          submitted_at?: string
          submitted_by_email?: string
          submitted_by_name?: string
          submitted_total?: number
          supplier_id?: string | null
          supplier_name?: string
          supplier_notes?: string | null
          updated_at?: string
          variance_amount?: number | null
          variance_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_invoice_submissions_magic_link_id_fkey"
            columns: ["magic_link_id"]
            isOneToOne: false
            referencedRelation: "magic_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_submissions_previous_submission_id_fkey"
            columns: ["previous_submission_id"]
            isOneToOne: false
            referencedRelation: "supplier_invoice_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_submissions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_invoice_submissions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact_email: string
          contact_name: string | null
          contact_phone: string | null
          country: string
          country_code: string | null
          created_at: string
          custom_payment_milestones: Json | null
          factory_location_id: string | null
          id: string
          lead_time_days: number
          name: string
          notes: string | null
          payment_terms: string | null
          payment_terms_template_id: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name?: string | null
          contact_phone?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          custom_payment_milestones?: Json | null
          factory_location_id?: string | null
          id?: string
          lead_time_days?: number
          name: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          custom_payment_milestones?: Json | null
          factory_location_id?: string | null
          id?: string
          lead_time_days?: number
          name?: string
          notes?: string | null
          payment_terms?: string | null
          payment_terms_template_id?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_factory_location_id_fkey"
            columns: ["factory_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_payment_terms_template_id_fkey"
            columns: ["payment_terms_template_id"]
            isOneToOne: false
            referencedRelation: "payment_terms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["transfer_document_type"]
          id: string
          name: string
          size: number | null
          storage_path: string | null
          transfer_id: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          url: string
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["transfer_document_type"]
          id?: string
          name: string
          size?: number | null
          storage_path?: string | null
          transfer_id: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["transfer_document_type"]
          id?: string
          name?: string
          size?: number | null
          storage_path?: string | null
          transfer_id?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_documents_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "transfer_documents_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_documents_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_line_items: {
        Row: {
          batch_id: string
          created_at: string
          credit_ledger_entry_id: string | null
          debit_ledger_entry_id: string | null
          discrepancy: number | null
          id: string
          product_name: string
          quantity: number
          received_at: string | null
          received_notes: string | null
          received_quantity: number | null
          sku: string
          sort_order: number
          status: Database["public"]["Enums"]["transfer_line_item_status"]
          total_cost: number
          transfer_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          batch_id: string
          created_at?: string
          credit_ledger_entry_id?: string | null
          debit_ledger_entry_id?: string | null
          discrepancy?: number | null
          id?: string
          product_name: string
          quantity: number
          received_at?: string | null
          received_notes?: string | null
          received_quantity?: number | null
          sku: string
          sort_order?: number
          status?: Database["public"]["Enums"]["transfer_line_item_status"]
          total_cost?: number
          transfer_id: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          batch_id?: string
          created_at?: string
          credit_ledger_entry_id?: string | null
          debit_ledger_entry_id?: string | null
          discrepancy?: number | null
          id?: string
          product_name?: string
          quantity?: number
          received_at?: string | null
          received_notes?: string | null
          received_quantity?: number | null
          sku?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["transfer_line_item_status"]
          total_cost?: number
          transfer_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_line_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_line_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "transfer_line_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "transfer_line_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_line_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_status_history: {
        Row: {
          changed_by: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_id: string
        }
        Insert: {
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["transfer_status"]
          transfer_id: string
        }
        Update: {
          changed_by?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["transfer_status"]
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_status_history_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "transfer_status_history_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_status_history_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_tracking_numbers: {
        Row: {
          carrier: string
          created_at: string
          id: string
          tracking_number: string
          tracking_url: string | null
          transfer_id: string
        }
        Insert: {
          carrier: string
          created_at?: string
          id?: string
          tracking_number: string
          tracking_url?: string | null
          transfer_id: string
        }
        Update: {
          carrier?: string
          created_at?: string
          id?: string
          tracking_number?: string
          tracking_url?: string | null
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_tracking_numbers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_quote_status"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "transfer_tracking_numbers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfer_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_tracking_numbers_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          actual_arrival_date: string | null
          actual_departure_date: string | null
          amazon_checked_in_date: string | null
          amazon_closed_date: string | null
          amazon_discrepancy: number | null
          amazon_received_date: string | null
          amazon_receiving_notes: string | null
          amazon_receiving_started_date: string | null
          amazon_receiving_status:
            | Database["public"]["Enums"]["amazon_receiving_status"]
            | null
          amazon_shipment_id: string | null
          carrier: string | null
          carrier_account_number: string | null
          container_numbers: string[]
          cost_currency: string
          cost_duties: number
          cost_freight: number
          cost_handling: number
          cost_insurance: number
          cost_other: number
          cost_taxes: number
          created_at: string
          created_by: string | null
          created_by_name: string | null
          customs_broker: string | null
          customs_clearance_date: string | null
          customs_entry_number: string | null
          customs_hs_code: string | null
          customs_notes: string | null
          customs_status: Database["public"]["Enums"]["customs_status"]
          destination_location_id: string
          id: string
          incoterms: string | null
          notes: string | null
          quote_confirmed_at: string | null
          scheduled_arrival_date: string | null
          scheduled_departure_date: string | null
          shipping_agent_id: string | null
          shipping_method: Database["public"]["Enums"]["shipping_method"] | null
          source_location_id: string
          status: Database["public"]["Enums"]["transfer_status"]
          total_cost: number
          transfer_number: string
          updated_at: string
        }
        Insert: {
          actual_arrival_date?: string | null
          actual_departure_date?: string | null
          amazon_checked_in_date?: string | null
          amazon_closed_date?: string | null
          amazon_discrepancy?: number | null
          amazon_received_date?: string | null
          amazon_receiving_notes?: string | null
          amazon_receiving_started_date?: string | null
          amazon_receiving_status?:
            | Database["public"]["Enums"]["amazon_receiving_status"]
            | null
          amazon_shipment_id?: string | null
          carrier?: string | null
          carrier_account_number?: string | null
          container_numbers?: string[]
          cost_currency?: string
          cost_duties?: number
          cost_freight?: number
          cost_handling?: number
          cost_insurance?: number
          cost_other?: number
          cost_taxes?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customs_broker?: string | null
          customs_clearance_date?: string | null
          customs_entry_number?: string | null
          customs_hs_code?: string | null
          customs_notes?: string | null
          customs_status?: Database["public"]["Enums"]["customs_status"]
          destination_location_id: string
          id?: string
          incoterms?: string | null
          notes?: string | null
          quote_confirmed_at?: string | null
          scheduled_arrival_date?: string | null
          scheduled_departure_date?: string | null
          shipping_agent_id?: string | null
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          source_location_id: string
          status?: Database["public"]["Enums"]["transfer_status"]
          total_cost?: number
          transfer_number?: string
          updated_at?: string
        }
        Update: {
          actual_arrival_date?: string | null
          actual_departure_date?: string | null
          amazon_checked_in_date?: string | null
          amazon_closed_date?: string | null
          amazon_discrepancy?: number | null
          amazon_received_date?: string | null
          amazon_receiving_notes?: string | null
          amazon_receiving_started_date?: string | null
          amazon_receiving_status?:
            | Database["public"]["Enums"]["amazon_receiving_status"]
            | null
          amazon_shipment_id?: string | null
          carrier?: string | null
          carrier_account_number?: string | null
          container_numbers?: string[]
          cost_currency?: string
          cost_duties?: number
          cost_freight?: number
          cost_handling?: number
          cost_insurance?: number
          cost_other?: number
          cost_taxes?: number
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          customs_broker?: string | null
          customs_clearance_date?: string | null
          customs_entry_number?: string | null
          customs_hs_code?: string | null
          customs_notes?: string | null
          customs_status?: Database["public"]["Enums"]["customs_status"]
          destination_location_id?: string
          id?: string
          incoterms?: string | null
          notes?: string | null
          quote_confirmed_at?: string | null
          scheduled_arrival_date?: string | null
          scheduled_departure_date?: string | null
          shipping_agent_id?: string | null
          shipping_method?:
            | Database["public"]["Enums"]["shipping_method"]
            | null
          source_location_id?: string
          status?: Database["public"]["Enums"]["transfer_status"]
          total_cost?: number
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_components: {
        Row: {
          bom_line_item_id: string
          component_batch_id: string
          consumption_ledger_entry_id: string | null
          created_at: string
          id: string
          quantity_allocated: number
          quantity_consumed: number | null
          sort_order: number
          total_cost: number
          unit_cost: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          bom_line_item_id: string
          component_batch_id: string
          consumption_ledger_entry_id?: string | null
          created_at?: string
          id?: string
          quantity_allocated: number
          quantity_consumed?: number | null
          sort_order?: number
          total_cost?: number
          unit_cost: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          bom_line_item_id?: string
          component_batch_id?: string
          consumption_ledger_entry_id?: string | null
          created_at?: string
          id?: string
          quantity_allocated?: number
          quantity_consumed?: number | null
          sort_order?: number
          total_cost?: number
          unit_cost?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_components_bom_line_item_id_fkey"
            columns: ["bom_line_item_id"]
            isOneToOne: false
            referencedRelation: "bom_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_components_component_batch_id_fkey"
            columns: ["component_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_components_component_batch_id_fkey"
            columns: ["component_batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "work_order_components_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_components_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_components_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_costs: {
        Row: {
          amount: number
          cost_type: Database["public"]["Enums"]["work_order_cost_type"]
          created_at: string
          description: string
          id: string
          invoice_id: string | null
          is_per_unit: boolean
          per_unit_rate: number | null
          quantity: number | null
          work_order_id: string
        }
        Insert: {
          amount: number
          cost_type: Database["public"]["Enums"]["work_order_cost_type"]
          created_at?: string
          description: string
          id?: string
          invoice_id?: string | null
          is_per_unit?: boolean
          per_unit_rate?: number | null
          quantity?: number | null
          work_order_id: string
        }
        Update: {
          amount?: number
          cost_type?: Database["public"]["Enums"]["work_order_cost_type"]
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string | null
          is_per_unit?: boolean
          per_unit_rate?: number | null
          quantity?: number | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_costs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_costs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_costs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_costs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_status_history: {
        Row: {
          changed_by_id: string | null
          changed_by_name: string | null
          created_at: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          work_order_id: string
        }
        Insert: {
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          work_order_id: string
        }
        Update: {
          changed_by_id?: string | null
          changed_by_name?: string | null
          created_at?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["work_order_id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          actual_end_date: string | null
          actual_output_quantity: number | null
          actual_start_date: string | null
          assembly_location_id: string
          bom_id: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          id: string
          notes: string | null
          output_batch_id: string | null
          planned_output_quantity: number
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          scrap_quantity: number | null
          status: Database["public"]["Enums"]["work_order_status"]
          updated_at: string
          work_order_number: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_output_quantity?: number | null
          actual_start_date?: string | null
          assembly_location_id: string
          bom_id: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          id?: string
          notes?: string | null
          output_batch_id?: string | null
          planned_output_quantity: number
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          scrap_quantity?: number | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
          work_order_number?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_output_quantity?: number | null
          actual_start_date?: string | null
          assembly_location_id?: string
          bom_id?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          id?: string
          notes?: string | null
          output_batch_id?: string | null
          planned_output_quantity?: number
          scheduled_end_date?: string | null
          scheduled_start_date?: string | null
          scrap_quantity?: number | null
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
          work_order_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assembly_location_id_fkey"
            columns: ["assembly_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "active_boms_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
    }
    Views: {
      active_boms_summary: {
        Row: {
          component_count: number | null
          created_at: string | null
          estimated_unit_cost: number | null
          expected_scrap_percent: number | null
          finished_product_id: string | null
          finished_product_name: string | null
          finished_product_sku: string | null
          id: string | null
          name: string | null
          output_quantity: number | null
          updated_at: string | null
          version: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_inventory_summary: {
        Row: {
          awd_inbound_total: number | null
          awd_total: number | null
          fba_fulfillable_total: number | null
          fba_inbound_total: number | null
          fba_reserved_total: number | null
          fba_unfulfillable_total: number | null
          last_synced_at: string | null
          unmapped_sku_count: number | null
        }
        Relationships: []
      }
      amazon_inventory_with_mapping: {
        Row: {
          asin: string | null
          awd_inbound_quantity: number | null
          awd_quantity: number | null
          condition: Database["public"]["Enums"]["amazon_condition"] | null
          fba_fulfillable: number | null
          fba_inbound_receiving: number | null
          fba_inbound_shipped: number | null
          fba_inbound_working: number | null
          fba_reserved: number | null
          fba_unfulfillable: number | null
          fnsku: string | null
          id: string | null
          internal_product_id: string | null
          internal_product_name: string | null
          internal_sku: string | null
          internal_sku_id: string | null
          last_synced_at: string | null
          mapping_status:
            | Database["public"]["Enums"]["amazon_mapping_status"]
            | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          product_name: string | null
          seller_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_sku_mappings_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_sku_mappings_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_sku_mappings_internal_sku_id_fkey"
            columns: ["internal_sku_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
        ]
      }
      available_stock_for_transfer: {
        Row: {
          available_quantity: number | null
          batch_id: string | null
          id: string | null
          location_id: string | null
          location_name: string | null
          po_number: string | null
          product_name: string | null
          sku: string | null
          supplier_name: string | null
          total_value: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      component_usage: {
        Row: {
          bom_usage: Json | null
          component_id: string | null
          component_name: string | null
          component_sku: string | null
          used_in_bom_count: number | null
        }
        Relationships: []
      }
      financial_summary: {
        Row: {
          outstanding: number | null
          overdue_count: number | null
          total_invoices: number | null
          total_paid: number | null
          upcoming_this_week: number | null
        }
        Relationships: []
      }
      finished_goods_landed_cost: {
        Row: {
          assembly_unit_cost: number | null
          batch_id: string | null
          batch_number: string | null
          completion_date: string | null
          flat_assembly_costs: number | null
          per_unit_assembly_costs: number | null
          product_name: string | null
          quantity: number | null
          sku: string | null
          total_component_cost: number | null
          total_transfer_costs: number | null
          work_order_date: string | null
          work_order_id: string | null
          work_order_number: string | null
        }
        Relationships: []
      }
      inspection_summary: {
        Row: {
          avg_defect_rate: number | null
          confirmed: number | null
          failed: number | null
          in_progress: number | null
          paid: number | null
          passed: number | null
          pending_confirmation: number | null
          pending_rework: number | null
          re_inspection: number | null
          report_submitted: number | null
          scheduled: number | null
          total: number | null
        }
        Relationships: []
      }
      magic_links_summary: {
        Row: {
          expiring_within_24_hours: number | null
          pending_submission: number | null
          submitted_this_week: number | null
          total_active: number | null
        }
        Relationships: []
      }
      shipping_invoice_with_variance: {
        Row: {
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string | null
          invoice_amount: number | null
          invoice_date: string | null
          invoice_number: string | null
          notes: string | null
          pdf_path: string | null
          quoted_amount: number | null
          shipping_agent_id: string | null
          shipping_agent_name: string | null
          shipping_quote_id: string | null
          status: Database["public"]["Enums"]["shipping_invoice_status"] | null
          updated_at: string | null
          variance_amount: number | null
          variance_percent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_invoices_shipping_quote_id_fkey"
            columns: ["shipping_quote_id"]
            isOneToOne: false
            referencedRelation: "shipping_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_quotes_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_by_location: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          first_received_at: string | null
          last_movement_at: string | null
          location_id: string | null
          location_name: string | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          po_number: string | null
          product_name: string | null
          sku: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_in: number | null
          total_out: number | null
          total_quantity: number | null
          total_value: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_by_product: {
        Row: {
          batch_count: number | null
          earliest_receipt: string | null
          latest_movement: string | null
          location_count: number | null
          product_name: string | null
          sku: string | null
          total_quantity: number | null
          total_value: number | null
        }
        Relationships: []
      }
      stock_positions: {
        Row: {
          batch_id: string | null
          first_received_at: string | null
          last_movement_at: string | null
          location_id: string | null
          product_name: string | null
          sku: string | null
          total_in: number | null
          total_out: number | null
          total_quantity: number | null
          total_value: number | null
          unit_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_submissions_summary: {
        Row: {
          approved: number | null
          partially_approved: number | null
          pending_review: number | null
          pending_variance_total: number | null
          rejected: number | null
        }
        Relationships: []
      }
      transfer_quote_status: {
        Row: {
          quote_confirmed_at: string | null
          quote_status: string | null
          selected_quote_amount: number | null
          selected_quote_id: string | null
          submitted_quotes: number | null
          total_quotes: number | null
          transfer_id: string | null
          transfer_number: string | null
        }
        Insert: {
          quote_confirmed_at?: string | null
          quote_status?: never
          selected_quote_amount?: never
          selected_quote_id?: never
          submitted_quotes?: never
          total_quotes?: never
          transfer_id?: string | null
          transfer_number?: string | null
        }
        Update: {
          quote_confirmed_at?: string | null
          quote_status?: never
          selected_quote_amount?: never
          selected_quote_id?: never
          submitted_quotes?: never
          total_quotes?: never
          transfer_id?: string | null
          transfer_number?: string | null
        }
        Relationships: []
      }
      transfer_summary: {
        Row: {
          actual_arrival_date: string | null
          actual_departure_date: string | null
          amazon_shipment_id: string | null
          carrier: string | null
          cost_currency: string | null
          created_at: string | null
          destination_location_id: string | null
          destination_location_name: string | null
          destination_location_type:
            | Database["public"]["Enums"]["location_type"]
            | null
          id: string | null
          line_item_count: number | null
          scheduled_arrival_date: string | null
          scheduled_departure_date: string | null
          shipping_agent_id: string | null
          shipping_agent_name: string | null
          shipping_method: Database["public"]["Enums"]["shipping_method"] | null
          source_location_id: string | null
          source_location_name: string | null
          source_location_type:
            | Database["public"]["Enums"]["location_type"]
            | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          total_cost: number | null
          total_units: number | null
          total_value: number | null
          transfer_number: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders_with_details: {
        Row: {
          actual_end_date: string | null
          actual_output_quantity: number | null
          actual_start_date: string | null
          assembly_location_id: string | null
          assembly_location_name: string | null
          bom_id: string | null
          bom_name: string | null
          component_count: number | null
          created_at: string | null
          created_by_name: string | null
          finished_product_id: string | null
          finished_product_name: string | null
          finished_product_sku: string | null
          id: string | null
          notes: string | null
          output_batch_id: string | null
          output_batch_number: string | null
          output_unit_cost: number | null
          planned_output_quantity: number | null
          scheduled_end_date: string | null
          scheduled_start_date: string | null
          scrap_quantity: number | null
          status: Database["public"]["Enums"]["work_order_status"] | null
          total_assembly_cost: number | null
          total_component_cost: number | null
          updated_at: string | null
          work_order_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "boms_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_assembly_location_id_fkey"
            columns: ["assembly_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "active_boms_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "boms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
    }
    Functions: {
      apply_submission_to_po: {
        Args: { submission_id: string }
        Returns: boolean
      }
      calculate_bom_estimated_cost: {
        Args: { p_bom_id: string }
        Returns: number
      }
      check_overdue_invoices: { Args: never; Returns: undefined }
      complete_work_order: {
        Args: {
          p_actual_output_quantity: number
          p_notes?: string
          p_scrap_quantity?: number
          p_work_order_id: string
        }
        Returns: string
      }
      create_batch_from_po_line_item: {
        Args: {
          p_factory_location_id: string
          p_line_item_id: string
          p_po_id: string
        }
        Returns: string
      }
      create_bom_version: {
        Args: {
          p_bom_id: string
          p_change_description: string
          p_new_version: string
          p_user_id?: string
          p_user_name?: string
        }
        Returns: string
      }
      create_revision_magic_link: {
        Args: { p_rejection_notes?: string; p_submission_id: string }
        Returns: {
          new_magic_link_id: string
          new_revision_number: number
          new_token: string
        }[]
      }
      detect_field_changes: {
        Args: { p_field_config: Json; p_new: Json; p_old: Json }
        Returns: Json
      }
      expire_overdue_magic_links: { Args: never; Returns: number }
      generate_batch_number: { Args: never; Returns: string }
      generate_inspection_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_po_number: { Args: never; Returns: string }
      generate_transfer_number: { Args: never; Returns: string }
      generate_work_order_number: { Args: never; Returns: string }
      get_batch_remaining_units: {
        Args: { p_batch_id: string }
        Returns: number
      }
      get_bom_with_components: {
        Args: { p_bom_id: string }
        Returns: {
          bom_id: string
          bom_name: string
          component_name: string
          component_product_id: string
          component_sku: string
          component_unit_cost: number
          expected_scrap_percent: number
          finished_product_id: string
          finished_product_name: string
          finished_product_sku: string
          output_quantity: number
          position_notes: string
          quantity_required: number
          uom: string
        }[]
      }
      get_current_user_info: {
        Args: never
        Returns: {
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_magic_links_needing_reminder: {
        Args: { days_before: number }
        Returns: {
          expires_at: string
          id: string
          linked_entity_name: string
          purpose: Database["public"]["Enums"]["magic_link_purpose"]
          recipient_email: string
          recipient_name: string
        }[]
      }
      get_stock_at_location: {
        Args: { p_location_id: string }
        Returns: {
          batch_id: string
          product_name: string
          sku: string
          total_quantity: number
          total_value: number
          unit_cost: number
        }[]
      }
      get_stock_for_batch: {
        Args: { p_batch_id: string }
        Returns: {
          first_received_at: string
          last_movement_at: string
          location_id: string
          location_name: string
          location_type: Database["public"]["Enums"]["location_type"]
          quantity: number
        }[]
      }
      log_activity: {
        Args: {
          p_action: Database["public"]["Enums"]["activity_action_type"]
          p_changes?: Json
          p_correlation_id?: string
          p_entity_id: string
          p_entity_name: string
          p_entity_type: Database["public"]["Enums"]["activity_entity_type"]
          p_is_system?: boolean
          p_notes?: string
        }
        Returns: string
      }
      merge_batches: {
        Args: { p_batch_ids: string[]; p_note?: string }
        Returns: string
      }
      split_batch:
        | {
            Args: {
              p_batch_id: string
              p_location_id: string
              p_reason?: string
              p_split_quantity: number
            }
            Returns: string
          }
        | {
            Args: {
              p_batch_id: string
              p_note?: string
              p_split_quantity: number
            }
            Returns: string
          }
    }
    Enums: {
      activity_action_type: "create" | "update" | "delete" | "status_change"
      activity_entity_type:
        | "product"
        | "supplier"
        | "purchase_order"
        | "batch"
        | "transfer"
        | "inspection"
        | "location"
        | "invoice"
        | "payment"
        | "brand"
        | "shipping_agent"
        | "setting"
        | "bom"
        | "work_order"
      amazon_condition:
        | "New"
        | "Refurbished"
        | "UsedLikeNew"
        | "UsedVeryGood"
        | "UsedGood"
        | "UsedAcceptable"
      amazon_connection_status: "pending" | "active" | "expired" | "revoked"
      amazon_inbound_type: "FBA" | "AWD"
      amazon_mapping_status: "mapped" | "unmapped" | "pending"
      amazon_marketplace: "US" | "CA" | "MX"
      amazon_receiving_status:
        | "checked-in"
        | "receiving"
        | "received"
        | "closed"
      amazon_shipment_status:
        | "WORKING"
        | "READY_TO_SHIP"
        | "SHIPPED"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "CHECKED_IN"
        | "RECEIVING"
        | "CLOSED"
        | "CANCELLED"
        | "DELETED"
        | "ERROR"
      amazon_shipment_type: "SP" | "LTL" | "FTL"
      batch_stage:
        | "ordered"
        | "factory"
        | "inspected"
        | "ready_to_ship"
        | "in-transit"
        | "warehouse"
        | "amazon"
      box_condition: "good" | "damaged" | "acceptable"
      brand_status: "active" | "inactive"
      customs_status: "pending" | "in-progress" | "cleared" | "held"
      defect_severity: "minor" | "major" | "critical"
      defect_type:
        | "cosmetic"
        | "functional"
        | "dimensional"
        | "packaging"
        | "labeling"
      inspection_decision_status: "pending" | "scheduled" | "not-needed"
      inspection_message_direction: "outbound" | "inbound" | "note"
      inspection_photo_type: "defect" | "product" | "packaging"
      inspection_status:
        | "scheduled"
        | "pending-confirmation"
        | "confirmed"
        | "paid"
        | "in-progress"
        | "report-submitted"
        | "passed"
        | "failed"
        | "pending-rework"
        | "re-inspection"
      invoice_creation_method: "manual" | "automatic" | "from-pi-approval"
      invoice_type:
        | "product"
        | "shipping"
        | "duties"
        | "inspection"
        | "storage"
        | "assembly"
      line_item_result: "pass" | "fail" | "pending"
      linked_entity_type:
        | "purchase-order"
        | "shipment"
        | "batch"
        | "inspection"
        | "transfer"
        | "work-order"
      location_type:
        | "factory"
        | "warehouse"
        | "3pl"
        | "amazon_fba"
        | "amazon_awd"
        | "port"
        | "customs"
      magic_link_entity_type: "purchase-order" | "transfer"
      magic_link_event_type:
        | "created"
        | "sent"
        | "reminder_sent"
        | "viewed"
        | "form_started"
        | "validation_error"
        | "submitted"
        | "expired"
        | "revoked"
        | "regenerated"
      magic_link_purpose: "invoice-submission" | "document-upload"
      magic_link_status: "active" | "submitted" | "expired" | "revoked"
      message_direction: "outbound" | "inbound" | "note"
      payment_method:
        | "wire-transfer"
        | "credit-card"
        | "paypal"
        | "check"
        | "other"
      payment_milestone_trigger:
        | "po_confirmed"
        | "inspection_passed"
        | "customs_cleared"
        | "shipment_departed"
        | "goods_received"
        | "manual"
        | "upfront"
      payment_status: "unpaid" | "partial" | "paid" | "overdue"
      payment_trigger_status: "pending" | "triggered" | "overdue"
      po_status:
        | "draft"
        | "sent"
        | "awaiting_invoice"
        | "invoice_received"
        | "confirmed"
        | "production_complete"
        | "ready-to-ship"
        | "partially-received"
        | "received"
        | "cancelled"
      product_status: "active" | "inactive" | "archived"
      product_type: "simple" | "component" | "finished_good"
      reconciliation_status: "matched" | "discrepancy"
      rework_status: "pending" | "in-progress" | "completed"
      shipping_invoice_status: "received" | "approved" | "paid"
      shipping_method:
        | "ocean-fcl"
        | "ocean-lcl"
        | "air-freight"
        | "air-express"
        | "ground"
        | "rail"
        | "courier"
      shipping_quote_status: "pending" | "submitted" | "selected" | "rejected"
      shipping_service: "ocean" | "air" | "trucking" | "rail" | "courier"
      sku_condition:
        | "new"
        | "refurbished"
        | "used-like-new"
        | "used-very-good"
        | "used-good"
        | "used-acceptable"
      stock_location_type:
        | "factory"
        | "warehouse"
        | "3pl"
        | "amazon-fba"
        | "amazon-awd"
      stock_movement_type:
        | "initial_receipt"
        | "transfer_out"
        | "transfer_in"
        | "adjustment_add"
        | "adjustment_remove"
        | "amazon_reconcile"
        | "assembly_consumption"
        | "assembly_output"
        | "batch_split_out"
        | "batch_split_in"
      supplier_additional_cost_type:
        | "handling"
        | "rush"
        | "tooling"
        | "shipping"
        | "inspection"
        | "packaging"
        | "other"
      supplier_invoice_status:
        | "none"
        | "pending-submission"
        | "pending-review"
        | "approved"
        | "rejected"
      supplier_status: "active" | "inactive" | "archived"
      supplier_submission_review_status:
        | "pending"
        | "approved"
        | "rejected"
        | "partially_approved"
      transfer_document_type:
        | "bill-of-lading"
        | "proof-of-delivery"
        | "customs-form"
        | "commercial-invoice"
        | "packing-list"
        | "certificate-of-origin"
        | "insurance-certificate"
        | "shipping-manifest"
        | "other"
      transfer_line_item_status:
        | "pending"
        | "in_transit"
        | "received"
        | "partial"
        | "cancelled"
      transfer_status:
        | "draft"
        | "booked"
        | "in-transit"
        | "delivered"
        | "completed"
        | "cancelled"
      work_order_cost_type:
        | "kitting_per_unit"
        | "kitting_flat"
        | "assembly_per_unit"
        | "assembly_flat"
        | "packaging"
        | "labor"
        | "other"
      work_order_status:
        | "draft"
        | "planned"
        | "in_progress"
        | "completed"
        | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action_type: ["create", "update", "delete", "status_change"],
      activity_entity_type: [
        "product",
        "supplier",
        "purchase_order",
        "batch",
        "transfer",
        "inspection",
        "location",
        "invoice",
        "payment",
        "brand",
        "shipping_agent",
        "setting",
        "bom",
        "work_order",
      ],
      amazon_condition: [
        "New",
        "Refurbished",
        "UsedLikeNew",
        "UsedVeryGood",
        "UsedGood",
        "UsedAcceptable",
      ],
      amazon_connection_status: ["pending", "active", "expired", "revoked"],
      amazon_inbound_type: ["FBA", "AWD"],
      amazon_mapping_status: ["mapped", "unmapped", "pending"],
      amazon_marketplace: ["US", "CA", "MX"],
      amazon_receiving_status: [
        "checked-in",
        "receiving",
        "received",
        "closed",
      ],
      amazon_shipment_status: [
        "WORKING",
        "READY_TO_SHIP",
        "SHIPPED",
        "IN_TRANSIT",
        "DELIVERED",
        "CHECKED_IN",
        "RECEIVING",
        "CLOSED",
        "CANCELLED",
        "DELETED",
        "ERROR",
      ],
      amazon_shipment_type: ["SP", "LTL", "FTL"],
      batch_stage: [
        "ordered",
        "factory",
        "inspected",
        "ready_to_ship",
        "in-transit",
        "warehouse",
        "amazon",
      ],
      box_condition: ["good", "damaged", "acceptable"],
      brand_status: ["active", "inactive"],
      customs_status: ["pending", "in-progress", "cleared", "held"],
      defect_severity: ["minor", "major", "critical"],
      defect_type: [
        "cosmetic",
        "functional",
        "dimensional",
        "packaging",
        "labeling",
      ],
      inspection_decision_status: ["pending", "scheduled", "not-needed"],
      inspection_message_direction: ["outbound", "inbound", "note"],
      inspection_photo_type: ["defect", "product", "packaging"],
      inspection_status: [
        "scheduled",
        "pending-confirmation",
        "confirmed",
        "paid",
        "in-progress",
        "report-submitted",
        "passed",
        "failed",
        "pending-rework",
        "re-inspection",
      ],
      invoice_creation_method: ["manual", "automatic", "from-pi-approval"],
      invoice_type: [
        "product",
        "shipping",
        "duties",
        "inspection",
        "storage",
        "assembly",
      ],
      line_item_result: ["pass", "fail", "pending"],
      linked_entity_type: [
        "purchase-order",
        "shipment",
        "batch",
        "inspection",
        "transfer",
        "work-order",
      ],
      location_type: [
        "factory",
        "warehouse",
        "3pl",
        "amazon_fba",
        "amazon_awd",
        "port",
        "customs",
      ],
      magic_link_entity_type: ["purchase-order", "transfer"],
      magic_link_event_type: [
        "created",
        "sent",
        "reminder_sent",
        "viewed",
        "form_started",
        "validation_error",
        "submitted",
        "expired",
        "revoked",
        "regenerated",
      ],
      magic_link_purpose: ["invoice-submission", "document-upload"],
      magic_link_status: ["active", "submitted", "expired", "revoked"],
      message_direction: ["outbound", "inbound", "note"],
      payment_method: [
        "wire-transfer",
        "credit-card",
        "paypal",
        "check",
        "other",
      ],
      payment_milestone_trigger: [
        "po_confirmed",
        "inspection_passed",
        "customs_cleared",
        "shipment_departed",
        "goods_received",
        "manual",
        "upfront",
      ],
      payment_status: ["unpaid", "partial", "paid", "overdue"],
      payment_trigger_status: ["pending", "triggered", "overdue"],
      po_status: [
        "draft",
        "sent",
        "awaiting_invoice",
        "invoice_received",
        "confirmed",
        "production_complete",
        "ready-to-ship",
        "partially-received",
        "received",
        "cancelled",
      ],
      product_status: ["active", "inactive", "archived"],
      product_type: ["simple", "component", "finished_good"],
      reconciliation_status: ["matched", "discrepancy"],
      rework_status: ["pending", "in-progress", "completed"],
      shipping_invoice_status: ["received", "approved", "paid"],
      shipping_method: [
        "ocean-fcl",
        "ocean-lcl",
        "air-freight",
        "air-express",
        "ground",
        "rail",
        "courier",
      ],
      shipping_quote_status: ["pending", "submitted", "selected", "rejected"],
      shipping_service: ["ocean", "air", "trucking", "rail", "courier"],
      sku_condition: [
        "new",
        "refurbished",
        "used-like-new",
        "used-very-good",
        "used-good",
        "used-acceptable",
      ],
      stock_location_type: [
        "factory",
        "warehouse",
        "3pl",
        "amazon-fba",
        "amazon-awd",
      ],
      stock_movement_type: [
        "initial_receipt",
        "transfer_out",
        "transfer_in",
        "adjustment_add",
        "adjustment_remove",
        "amazon_reconcile",
        "assembly_consumption",
        "assembly_output",
        "batch_split_out",
        "batch_split_in",
      ],
      supplier_additional_cost_type: [
        "handling",
        "rush",
        "tooling",
        "shipping",
        "inspection",
        "packaging",
        "other",
      ],
      supplier_invoice_status: [
        "none",
        "pending-submission",
        "pending-review",
        "approved",
        "rejected",
      ],
      supplier_status: ["active", "inactive", "archived"],
      supplier_submission_review_status: [
        "pending",
        "approved",
        "rejected",
        "partially_approved",
      ],
      transfer_document_type: [
        "bill-of-lading",
        "proof-of-delivery",
        "customs-form",
        "commercial-invoice",
        "packing-list",
        "certificate-of-origin",
        "insurance-certificate",
        "shipping-manifest",
        "other",
      ],
      transfer_line_item_status: [
        "pending",
        "in_transit",
        "received",
        "partial",
        "cancelled",
      ],
      transfer_status: [
        "draft",
        "booked",
        "in-transit",
        "delivered",
        "completed",
        "cancelled",
      ],
      work_order_cost_type: [
        "kitting_per_unit",
        "kitting_flat",
        "assembly_per_unit",
        "assembly_flat",
        "packaging",
        "labor",
        "other",
      ],
      work_order_status: [
        "draft",
        "planned",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const

// =============================================================================
// TYPE ALIASES
// =============================================================================

// Core entity types
export type DbBrand = Database["public"]["Tables"]["brands"]["Row"]
export type DbProduct = Database["public"]["Tables"]["products"]["Row"]
export type DbProductImage = Database["public"]["Tables"]["product_images"]["Row"]
export type DbProductSpecSheet = Database["public"]["Tables"]["product_spec_sheets"]["Row"]
export type DbSupplier = Database["public"]["Tables"]["suppliers"]["Row"]
export type DbPurchaseOrder = Database["public"]["Tables"]["purchase_orders"]["Row"]
export type DbPOLineItem = Database["public"]["Tables"]["po_line_items"]["Row"]
export type DbPOStatusHistory = Database["public"]["Tables"]["po_status_history"]["Row"]
export type DbPOMessage = Database["public"]["Tables"]["po_messages"]["Row"]
export type DbPOAttachment = Database["public"]["Tables"]["po_attachments"]["Row"]
export type DbPODocument = Database["public"]["Tables"]["po_documents"]["Row"]
export type DbPaymentTermsTemplate = Database["public"]["Tables"]["payment_terms_templates"]["Row"]
export type DbInvoice = Database["public"]["Tables"]["invoices"]["Row"]
export type DbInvoicePayment = Database["public"]["Tables"]["invoice_payments"]["Row"]
export type DbInvoicePaymentScheduleItem = Database["public"]["Tables"]["invoice_payment_schedule_items"]["Row"]
export type DbInvoicePaymentAttachment = Database["public"]["Tables"]["invoice_payment_attachments"]["Row"]
export type DbStockLedgerEntry = Database["public"]["Tables"]["stock_ledger_entries"]["Row"]
export type DbTransfer = Database["public"]["Tables"]["transfers"]["Row"]
export type DbTransferLineItem = Database["public"]["Tables"]["transfer_line_items"]["Row"]
export type DbInspection = Database["public"]["Tables"]["inspections"]["Row"]
export type DbInspectionLineItem = Database["public"]["Tables"]["inspection_line_items"]["Row"]
export type DbInspectionDefect = Database["public"]["Tables"]["inspection_defects"]["Row"]
export type DbInspectionMeasurement = Database["public"]["Tables"]["inspection_measurements"]["Row"]
export type DbInspectionPhoto = Database["public"]["Tables"]["inspection_photos"]["Row"]
export type DbReworkRequest = Database["public"]["Tables"]["rework_requests"]["Row"]
export type DbInspectionMessage = Database["public"]["Tables"]["inspection_messages"]["Row"]
export type DbLocation = Database["public"]["Tables"]["locations"]["Row"]
export type DbBatch = Database["public"]["Tables"]["batches"]["Row"]
export type DbStock = Database["public"]["Tables"]["stock"]["Row"]
export type DbAmazonConnection = Database["public"]["Tables"]["amazon_connections"]["Row"]
export type DbAmazonProduct = Database["public"]["Tables"]["amazon_products"]["Row"]
export type DbAmazonInventory = Database["public"]["Tables"]["amazon_inventory"]["Row"]
export type DbAmazonShipment = Database["public"]["Tables"]["amazon_shipments"]["Row"]
export type DbAmazonShipmentItem = Database["public"]["Tables"]["amazon_shipment_items"]["Row"]
export type DbActivityLog = Database["public"]["Tables"]["activity_log"]["Row"]
export type DbMagicLink = Database["public"]["Tables"]["magic_links"]["Row"]
export type DbMagicLinkEvent = Database["public"]["Tables"]["magic_link_events"]["Row"]
export type DbSupplierInvoiceSubmission = Database["public"]["Tables"]["supplier_invoice_submissions"]["Row"]

// Shipping agents and messages (for Inbox feature)
export type DbShippingAgent = Database["public"]["Tables"]["shipping_agents"]["Row"]
export type DbShippingAgentMessage = Database["public"]["Tables"]["shipping_agent_messages"]["Row"]
export type DbShippingAgentMessageAttachment = Database["public"]["Tables"]["shipping_agent_message_attachments"]["Row"]

// Enum types
export type MessageDirection = Database["public"]["Enums"]["message_direction"]
export type POStatus = Database["public"]["Enums"]["po_status"]
export type TransferStatus = Database["public"]["Enums"]["transfer_status"]
export type InspectionStatus = Database["public"]["Enums"]["inspection_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type ShippingService = Database["public"]["Enums"]["shipping_service"]
