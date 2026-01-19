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
    PostgrestVersion: "14.1"
  }
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
      amazon_fee_allocations: {
        Row: {
          allocated_amount: number
          allocation_basis_quantity: number | null
          allocation_basis_value: number | null
          allocation_method: Database["public"]["Enums"]["fee_allocation_method"]
          allocation_month: string
          allocation_percentage: number | null
          batch_id: string | null
          created_at: string
          fee_id: string
          id: string
          order_item_id: string | null
          product_id: string | null
        }
        Insert: {
          allocated_amount: number
          allocation_basis_quantity?: number | null
          allocation_basis_value?: number | null
          allocation_method: Database["public"]["Enums"]["fee_allocation_method"]
          allocation_month: string
          allocation_percentage?: number | null
          batch_id?: string | null
          created_at?: string
          fee_id: string
          id?: string
          order_item_id?: string | null
          product_id?: string | null
        }
        Update: {
          allocated_amount?: number
          allocation_basis_quantity?: number | null
          allocation_basis_value?: number | null
          allocation_method?: Database["public"]["Enums"]["fee_allocation_method"]
          allocation_month?: string
          allocation_percentage?: number | null
          batch_id?: string | null
          created_at?: string
          fee_id?: string
          id?: string
          order_item_id?: string | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "amazon_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_fee_id_fkey"
            columns: ["fee_id"]
            isOneToOne: false
            referencedRelation: "unallocated_amazon_fees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "amazon_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "pending_cogs_attribution"
            referencedColumns: ["order_item_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "unattributed_sales"
            referencedColumns: ["order_item_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_fees: {
        Row: {
          amazon_shipment_id: string | null
          amount: number
          attribution_level: Database["public"]["Enums"]["fee_attribution_level"]
          batch_id: string | null
          created_at: string
          description: string | null
          exchange_rate_to_usd: number
          fee_date: string
          fee_type: Database["public"]["Enums"]["amazon_fee_type"]
          id: string
          include_in_cogs: boolean
          internal_product_id: string | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id: string | null
          order_item_id: string | null
          original_amount: number | null
          original_currency: string
          period_end: string | null
          period_start: string | null
          source: string
          source_reference: string | null
          updated_at: string
        }
        Insert: {
          amazon_shipment_id?: string | null
          amount: number
          attribution_level: Database["public"]["Enums"]["fee_attribution_level"]
          batch_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rate_to_usd?: number
          fee_date: string
          fee_type: Database["public"]["Enums"]["amazon_fee_type"]
          id?: string
          include_in_cogs?: boolean
          internal_product_id?: string | null
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id?: string | null
          order_item_id?: string | null
          original_amount?: number | null
          original_currency?: string
          period_end?: string | null
          period_start?: string | null
          source?: string
          source_reference?: string | null
          updated_at?: string
        }
        Update: {
          amazon_shipment_id?: string | null
          amount?: number
          attribution_level?: Database["public"]["Enums"]["fee_attribution_level"]
          batch_id?: string | null
          created_at?: string
          description?: string | null
          exchange_rate_to_usd?: number
          fee_date?: string
          fee_type?: Database["public"]["Enums"]["amazon_fee_type"]
          id?: string
          include_in_cogs?: boolean
          internal_product_id?: string | null
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id?: string | null
          order_item_id?: string | null
          original_amount?: number | null
          original_currency?: string
          period_end?: string | null
          period_start?: string | null
          source?: string
          source_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fees_amazon_shipment_id_fkey"
            columns: ["amazon_shipment_id"]
            isOneToOne: false
            referencedRelation: "amazon_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "amazon_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "amazon_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "pending_cogs_attribution"
            referencedColumns: ["order_item_id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "unattributed_sales"
            referencedColumns: ["order_item_id"]
          },
        ]
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
      amazon_order_items: {
        Row: {
          asin: string
          cogs_attributed_at: string | null
          cogs_calculated: boolean
          created_at: string
          id: string
          internal_product_id: string | null
          internal_sku_id: string | null
          item_price: number
          item_price_usd: number | null
          item_tax: number
          order_id: string
          order_item_id: string
          quantity_ordered: number
          quantity_shipped: number
          seller_sku: string
          shipping_price: number
          shipping_tax: number
          total_revenue_usd: number | null
        }
        Insert: {
          asin: string
          cogs_attributed_at?: string | null
          cogs_calculated?: boolean
          created_at?: string
          id?: string
          internal_product_id?: string | null
          internal_sku_id?: string | null
          item_price?: number
          item_price_usd?: number | null
          item_tax?: number
          order_id: string
          order_item_id: string
          quantity_ordered: number
          quantity_shipped?: number
          seller_sku: string
          shipping_price?: number
          shipping_tax?: number
          total_revenue_usd?: number | null
        }
        Update: {
          asin?: string
          cogs_attributed_at?: string | null
          cogs_calculated?: boolean
          created_at?: string
          id?: string
          internal_product_id?: string | null
          internal_sku_id?: string | null
          item_price?: number
          item_price_usd?: number | null
          item_tax?: number
          order_id?: string
          order_item_id?: string
          quantity_ordered?: number
          quantity_shipped?: number
          seller_sku?: string
          shipping_price?: number
          shipping_tax?: number
          total_revenue_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_sku_id_fkey"
            columns: ["internal_sku_id"]
            isOneToOne: false
            referencedRelation: "product_skus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "amazon_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_orders: {
        Row: {
          amazon_order_id: string
          created_at: string
          currency: string
          delivery_date: string | null
          exchange_rate_to_usd: number
          id: string
          last_synced_at: string
          marketplace: Database["public"]["Enums"]["amazon_marketplace"]
          order_total: number | null
          order_total_usd: number | null
          purchase_date: string
          sales_channel: Database["public"]["Enums"]["amazon_sales_channel"]
          ship_date: string | null
          status: Database["public"]["Enums"]["amazon_order_status"]
          sync_source: string
          updated_at: string
        }
        Insert: {
          amazon_order_id: string
          created_at?: string
          currency?: string
          delivery_date?: string | null
          exchange_rate_to_usd?: number
          id?: string
          last_synced_at?: string
          marketplace: Database["public"]["Enums"]["amazon_marketplace"]
          order_total?: number | null
          order_total_usd?: number | null
          purchase_date: string
          sales_channel?: Database["public"]["Enums"]["amazon_sales_channel"]
          ship_date?: string | null
          status?: Database["public"]["Enums"]["amazon_order_status"]
          sync_source?: string
          updated_at?: string
        }
        Update: {
          amazon_order_id?: string
          created_at?: string
          currency?: string
          delivery_date?: string | null
          exchange_rate_to_usd?: number
          id?: string
          last_synced_at?: string
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"]
          order_total?: number | null
          order_total_usd?: number | null
          purchase_date?: string
          sales_channel?: Database["public"]["Enums"]["amazon_sales_channel"]
          ship_date?: string | null
          status?: Database["public"]["Enums"]["amazon_order_status"]
          sync_source?: string
          updated_at?: string
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_reconciliations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "batch_attachments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "batch_stage_history_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
      cogs_settings: {
        Row: {
          created_at: string
          custom_inclusions: Json | null
          description: string | null
          export_decimal_places: number | null
          export_format: string | null
          export_include_headers: boolean | null
          id: string
          include_advertising: boolean
          include_assembly_costs: boolean
          include_awd_processing: boolean
          include_awd_storage: boolean
          include_awd_transportation: boolean
          include_damaged_lost: boolean
          include_disposed: boolean
          include_duties_taxes: boolean
          include_fba_fulfillment: boolean
          include_fba_labeling: boolean
          include_fba_prep: boolean
          include_fba_storage: boolean
          include_inbound_placement: boolean
          include_inbound_transportation: boolean
          include_product_cost: boolean
          include_referral_fees: boolean
          include_shipping_to_amazon: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_inclusions?: Json | null
          description?: string | null
          export_decimal_places?: number | null
          export_format?: string | null
          export_include_headers?: boolean | null
          id?: string
          include_advertising?: boolean
          include_assembly_costs?: boolean
          include_awd_processing?: boolean
          include_awd_storage?: boolean
          include_awd_transportation?: boolean
          include_damaged_lost?: boolean
          include_disposed?: boolean
          include_duties_taxes?: boolean
          include_fba_fulfillment?: boolean
          include_fba_labeling?: boolean
          include_fba_prep?: boolean
          include_fba_storage?: boolean
          include_inbound_placement?: boolean
          include_inbound_transportation?: boolean
          include_product_cost?: boolean
          include_referral_fees?: boolean
          include_shipping_to_amazon?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_inclusions?: Json | null
          description?: string | null
          export_decimal_places?: number | null
          export_format?: string | null
          export_include_headers?: boolean | null
          id?: string
          include_advertising?: boolean
          include_assembly_costs?: boolean
          include_awd_processing?: boolean
          include_awd_storage?: boolean
          include_awd_transportation?: boolean
          include_damaged_lost?: boolean
          include_disposed?: boolean
          include_duties_taxes?: boolean
          include_fba_fulfillment?: boolean
          include_fba_labeling?: boolean
          include_fba_prep?: boolean
          include_fba_storage?: boolean
          include_inbound_placement?: boolean
          include_inbound_transportation?: boolean
          include_product_cost?: boolean
          include_referral_fees?: boolean
          include_shipping_to_amazon?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          brand_id: string | null
          created_at: string
          data_snapshot: Json
          document_name: string
          document_type: Database["public"]["Enums"]["generated_document_type"]
          file_size: number
          file_url: string
          generated_by_id: string | null
          generated_by_name: string | null
          generation_trigger: string | null
          id: string
          notes: string | null
          source_entity_id: string
          source_entity_ref: string
          source_entity_type: Database["public"]["Enums"]["document_source_type"]
          storage_path: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          data_snapshot?: Json
          document_name: string
          document_type: Database["public"]["Enums"]["generated_document_type"]
          file_size?: number
          file_url: string
          generated_by_id?: string | null
          generated_by_name?: string | null
          generation_trigger?: string | null
          id?: string
          notes?: string | null
          source_entity_id: string
          source_entity_ref: string
          source_entity_type: Database["public"]["Enums"]["document_source_type"]
          storage_path: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          data_snapshot?: Json
          document_name?: string
          document_type?: Database["public"]["Enums"]["generated_document_type"]
          file_size?: number
          file_url?: string
          generated_by_id?: string | null
          generated_by_name?: string | null
          generation_trigger?: string | null
          id?: string
          notes?: string | null
          source_entity_id?: string
          source_entity_ref?: string
          source_entity_type?: Database["public"]["Enums"]["document_source_type"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
      inventory_losses: {
        Row: {
          amazon_case_id: string | null
          batch_id: string | null
          created_at: string
          description: string | null
          fnsku: string | null
          id: string
          include_in_cogs: boolean
          loss_date: string
          loss_type: Database["public"]["Enums"]["inventory_loss_type"]
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          net_loss: number | null
          notes: string | null
          product_id: string | null
          quantity: number
          reimbursement_amount: number | null
          reimbursement_date: string | null
          reimbursement_reference: string | null
          reimbursement_status: Database["public"]["Enums"]["reimbursement_status"]
          seller_sku: string
          source: string
          source_reference: string | null
          total_cost: number | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          amazon_case_id?: string | null
          batch_id?: string | null
          created_at?: string
          description?: string | null
          fnsku?: string | null
          id?: string
          include_in_cogs?: boolean
          loss_date: string
          loss_type: Database["public"]["Enums"]["inventory_loss_type"]
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          net_loss?: number | null
          notes?: string | null
          product_id?: string | null
          quantity: number
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          reimbursement_reference?: string | null
          reimbursement_status?: Database["public"]["Enums"]["reimbursement_status"]
          seller_sku: string
          source?: string
          source_reference?: string | null
          total_cost?: number | null
          unit_cost: number
          updated_at?: string
        }
        Update: {
          amazon_case_id?: string | null
          batch_id?: string | null
          created_at?: string
          description?: string | null
          fnsku?: string | null
          id?: string
          include_in_cogs?: boolean
          loss_date?: string
          loss_type?: Database["public"]["Enums"]["inventory_loss_type"]
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          net_loss?: number | null
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reimbursement_amount?: number | null
          reimbursement_date?: string | null
          reimbursement_reference?: string | null
          reimbursement_status?: Database["public"]["Enums"]["reimbursement_status"]
          seller_sku?: string
          source?: string
          source_reference?: string | null
          total_cost?: number | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
          purchase_order_id: string
          sender_email: string | null
          sender_name: string
        }
        Insert: {
          content: string
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          purchase_order_id: string
          sender_email?: string | null
          sender_name: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
          dim_factor: number
          fnsku: string | null
          height_cm: number | null
          id: string
          image_storage_path: string | null
          image_url: string | null
          length_cm: number | null
          name: string
          product_type: Database["public"]["Enums"]["product_type"]
          sku: string
          status: Database["public"]["Enums"]["product_status"]
          supplier_id: string | null
          unit_cost: number
          updated_at: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          asin?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dim_factor?: number
          fnsku?: string | null
          height_cm?: number | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          length_cm?: number | null
          name: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sku: string
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          asin?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          dim_factor?: number
          fnsku?: string | null
          height_cm?: number | null
          id?: string
          image_storage_path?: string | null
          image_url?: string | null
          length_cm?: number | null
          name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          sku?: string
          status?: Database["public"]["Enums"]["product_status"]
          supplier_id?: string | null
          unit_cost?: number
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
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
      sales_batch_attributions: {
        Row: {
          attributed_date: string
          batch_id: string
          created_at: string
          id: string
          order_item_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          attributed_date: string
          batch_id: string
          created_at?: string
          id?: string
          order_item_id: string
          quantity: number
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          attributed_date?: string
          batch_id?: string
          created_at?: string
          id?: string
          order_item_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_batch_attributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "amazon_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "pending_cogs_attribution"
            referencedColumns: ["order_item_id"]
          },
          {
            foreignKeyName: "sales_batch_attributions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "unattributed_sales"
            referencedColumns: ["order_item_id"]
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
          is_read: boolean
          sender_email: string | null
          sender_name: string
          shipping_agent_id: string
        }
        Insert: {
          content: string
          created_at?: string
          direction: string
          id?: string
          is_read?: boolean
          sender_email?: string | null
          sender_name: string
          shipping_agent_id: string
        }
        Update: {
          content?: string
          created_at?: string
          direction?: string
          id?: string
          is_read?: boolean
          sender_email?: string | null
          sender_name?: string
          shipping_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_agent_messages_shipping_agent_id_fkey"
            columns: ["shipping_agent_id"]
            isOneToOne: false
            referencedRelation: "shipping_agents"
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "transfer_line_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "work_order_components_component_batch_id_fkey"
            columns: ["component_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
      active_cogs_settings: {
        Row: {
          created_at: string | null
          custom_inclusions: Json | null
          description: string | null
          export_decimal_places: number | null
          export_format: string | null
          export_include_headers: boolean | null
          id: string | null
          include_advertising: boolean | null
          include_assembly_costs: boolean | null
          include_awd_processing: boolean | null
          include_awd_storage: boolean | null
          include_awd_transportation: boolean | null
          include_damaged_lost: boolean | null
          include_disposed: boolean | null
          include_duties_taxes: boolean | null
          include_fba_fulfillment: boolean | null
          include_fba_labeling: boolean | null
          include_fba_prep: boolean | null
          include_fba_storage: boolean | null
          include_inbound_placement: boolean | null
          include_inbound_transportation: boolean | null
          include_product_cost: boolean | null
          include_referral_fees: boolean | null
          include_shipping_to_amazon: boolean | null
          is_default: boolean | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      amazon_fees_by_batch: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          fee_type: Database["public"]["Enums"]["amazon_fee_type"] | null
          first_fee_date: string | null
          last_fee_date: string | null
          sku: string | null
          total_allocated: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      amazon_fees_by_product: {
        Row: {
          fee_type: Database["public"]["Enums"]["amazon_fee_type"] | null
          month: string | null
          product_id: string | null
          product_name: string | null
          sku: string | null
          total_allocated: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      amazon_fees_summary: {
        Row: {
          attribution_level:
            | Database["public"]["Enums"]["fee_attribution_level"]
            | null
          cogs_amount: number | null
          fee_count: number | null
          fee_type: Database["public"]["Enums"]["amazon_fee_type"] | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          month: string | null
          total_amount: number | null
          total_charges: number | null
          total_reimbursements: number | null
        }
        Relationships: []
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
      batch_cogs: {
        Row: {
          amazon_fees_allocated: number | null
          amazon_fees_direct: number | null
          assembly_costs: number | null
          batch_id: string | null
          batch_number: string | null
          created_at: string | null
          inventory_losses: number | null
          ordered_date: string | null
          original_quantity: number | null
          po_id: string | null
          product_id: string | null
          product_name: string | null
          product_total_cost: number | null
          product_unit_cost: number | null
          sku: string | null
          stage: Database["public"]["Enums"]["batch_stage"] | null
          supplier_id: string | null
          supplier_name: string | null
          transfer_costs: number | null
          units_lost: number | null
          units_remaining: number | null
          units_sold: number | null
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
      batch_fifo_report: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          cogs_recognized: number | null
          days_to_deplete: number | null
          first_sale_date: string | null
          last_sale_date: string | null
          ordered_date: string | null
          original_quantity: number | null
          product_id: string | null
          product_name: string | null
          quantity_lost: number | null
          quantity_remaining: number | null
          quantity_sold: number | null
          received_date: string | null
          sku: string | null
          stage: Database["public"]["Enums"]["batch_stage"] | null
          supplier_id: string | null
          supplier_name: string | null
          unit_cost: number | null
        }
        Relationships: [
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
      cogs_monthly_summary: {
        Row: {
          avg_unit_cost: number | null
          gross_margin_pct: number | null
          gross_profit: number | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          month: string | null
          order_count: number | null
          product_cost: number | null
          total_revenue: number | null
          units_sold: number | null
        }
        Relationships: []
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
      generated_documents_summary: {
        Row: {
          inspections: number | null
          purchase_orders: number | null
          this_month: number | null
          total: number | null
          transfers: number | null
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
      inventory_loss_summary: {
        Row: {
          loss_count: number | null
          loss_type: Database["public"]["Enums"]["inventory_loss_type"] | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          month: string | null
          pending_reimbursements: number | null
          total_cost: number | null
          total_net_loss: number | null
          total_reimbursed: number | null
          total_units: number | null
        }
        Relationships: []
      }
      inventory_losses_by_batch: {
        Row: {
          batch_id: string | null
          batch_number: string | null
          first_loss_date: string | null
          last_loss_date: string | null
          sku: string | null
          total_cost: number | null
          total_net_loss: number | null
          total_reimbursed: number | null
          total_units_lost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      inventory_losses_by_product: {
        Row: {
          month: string | null
          product_id: string | null
          product_name: string | null
          seller_sku: string | null
          total_cost: number | null
          total_net_loss: number | null
          total_reimbursed: number | null
          total_units_lost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      monthly_product_cogs: {
        Row: {
          avg_unit_cost: number | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          month: string | null
          product_cost: number | null
          product_id: string | null
          product_name: string | null
          revenue_usd: number | null
          sku: string | null
          units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_product_fees: {
        Row: {
          awd_fees: number | null
          fba_fulfillment_fees: number | null
          inbound_placement_fees: number | null
          inbound_transportation_fees: number | null
          month: string | null
          product_id: string | null
          product_name: string | null
          storage_fees: number | null
          total_fees: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fee_allocations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_product_losses: {
        Row: {
          month: string | null
          product_id: string | null
          product_name: string | null
          total_loss: number | null
          units_lost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_sales_summary: {
        Row: {
          internal_product_id: string | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          month: string | null
          order_count: number | null
          pending_cogs_count: number | null
          product_name: string | null
          revenue_usd: number | null
          seller_sku: string | null
          units_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_cogs_attribution: {
        Row: {
          internal_product_id: string | null
          order_item_id: string | null
          product_name: string | null
          quantity_shipped: number | null
          seller_sku: string | null
          ship_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_reimbursements: {
        Row: {
          amazon_case_id: string | null
          batch_id: string | null
          batch_number: string | null
          created_at: string | null
          description: string | null
          fnsku: string | null
          id: string | null
          include_in_cogs: boolean | null
          loss_date: string | null
          loss_type: Database["public"]["Enums"]["inventory_loss_type"] | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          net_loss: number | null
          notes: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          reimbursement_amount: number | null
          reimbursement_date: string | null
          reimbursement_reference: string | null
          reimbursement_status:
            | Database["public"]["Enums"]["reimbursement_status"]
            | null
          seller_sku: string | null
          source: string | null
          source_reference: string | null
          total_cost: number | null
          unit_cost: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_losses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_dimensions: {
        Row: {
          billable_weight_kg: number | null
          dim_factor: number | null
          has_dimensions: boolean | null
          height_cm: number | null
          id: string | null
          length_cm: number | null
          name: string | null
          sku: string | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          billable_weight_kg?: never
          dim_factor?: number | null
          has_dimensions?: never
          height_cm?: number | null
          id?: string | null
          length_cm?: number | null
          name?: string | null
          sku?: string | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          billable_weight_kg?: never
          dim_factor?: number | null
          has_dimensions?: never
          height_cm?: number | null
          id?: string | null
          length_cm?: number | null
          name?: string | null
          sku?: string | null
          weight_kg?: number | null
          width_cm?: number | null
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "stock_ledger_entries_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
      unallocated_amazon_fees: {
        Row: {
          amazon_shipment_id: string | null
          amount: number | null
          attribution_level:
            | Database["public"]["Enums"]["fee_attribution_level"]
            | null
          batch_id: string | null
          created_at: string | null
          description: string | null
          exchange_rate_to_usd: number | null
          fee_date: string | null
          fee_type: Database["public"]["Enums"]["amazon_fee_type"] | null
          id: string | null
          include_in_cogs: boolean | null
          internal_product_id: string | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id: string | null
          order_item_id: string | null
          original_amount: number | null
          original_currency: string | null
          period_end: string | null
          period_start: string | null
          source: string | null
          source_reference: string | null
          updated_at: string | null
        }
        Insert: {
          amazon_shipment_id?: string | null
          amount?: number | null
          attribution_level?:
            | Database["public"]["Enums"]["fee_attribution_level"]
            | null
          batch_id?: string | null
          created_at?: string | null
          description?: string | null
          exchange_rate_to_usd?: number | null
          fee_date?: string | null
          fee_type?: Database["public"]["Enums"]["amazon_fee_type"] | null
          id?: string | null
          include_in_cogs?: boolean | null
          internal_product_id?: string | null
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id?: string | null
          order_item_id?: string | null
          original_amount?: number | null
          original_currency?: string | null
          period_end?: string | null
          period_start?: string | null
          source?: string | null
          source_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amazon_shipment_id?: string | null
          amount?: number | null
          attribution_level?:
            | Database["public"]["Enums"]["fee_attribution_level"]
            | null
          batch_id?: string | null
          created_at?: string | null
          description?: string | null
          exchange_rate_to_usd?: number | null
          fee_date?: string | null
          fee_type?: Database["public"]["Enums"]["amazon_fee_type"] | null
          id?: string | null
          include_in_cogs?: boolean | null
          internal_product_id?: string | null
          marketplace?: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_id?: string | null
          order_item_id?: string | null
          original_amount?: number | null
          original_currency?: string | null
          period_end?: string | null
          period_start?: string | null
          source?: string | null
          source_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_fees_amazon_shipment_id_fkey"
            columns: ["amazon_shipment_id"]
            isOneToOne: false
            referencedRelation: "amazon_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "finished_goods_landed_cost"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "amazon_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "amazon_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "pending_cogs_attribution"
            referencedColumns: ["order_item_id"]
          },
          {
            foreignKeyName: "amazon_fees_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "unattributed_sales"
            referencedColumns: ["order_item_id"]
          },
        ]
      }
      unattributed_sales: {
        Row: {
          amazon_order_id: string | null
          attributed_quantity: number | null
          internal_product_id: string | null
          marketplace: Database["public"]["Enums"]["amazon_marketplace"] | null
          order_item_id: string | null
          product_name: string | null
          requested_quantity: number | null
          seller_sku: string | null
          ship_date: string | null
          unattributed_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "component_usage"
            referencedColumns: ["component_id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amazon_order_items_internal_product_id_fkey"
            columns: ["internal_product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            referencedRelation: "product_dimensions"
            referencedColumns: ["id"]
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
            referencedRelation: "batch_cogs"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "work_orders_output_batch_id_fkey"
            columns: ["output_batch_id"]
            isOneToOne: false
            referencedRelation: "batch_fifo_report"
            referencedColumns: ["batch_id"]
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
      allocate_fee_by_inventory: {
        Args: { p_fee_id: string; p_period_end: string; p_period_start: string }
        Returns: number
      }
      allocate_fee_by_sales: {
        Args: { p_end_date: string; p_fee_id: string; p_start_date: string }
        Returns: number
      }
      apply_submission_to_po: {
        Args: { submission_id: string }
        Returns: boolean
      }
      attribute_sale_to_batches: {
        Args: {
          p_order_item_id: string
          p_quantity: number
          p_seller_sku: string
          p_ship_date: string
        }
        Returns: number
      }
      calculate_billable_weight: {
        Args: {
          p_dim_factor?: number
          p_height_cm: number
          p_length_cm: number
          p_weight_kg: number
          p_width_cm: number
        }
        Returns: number
      }
      calculate_bom_estimated_cost: {
        Args: { p_bom_id: string }
        Returns: number
      }
      calculate_product_cogs: {
        Args: {
          p_end_date: string
          p_product_id: string
          p_settings_name?: string
          p_start_date: string
        }
        Returns: {
          avg_cogs_per_unit: number
          awd_fees: number
          fba_fees: number
          inbound_fees: number
          inventory_losses: number
          period_end: string
          period_start: string
          product_cost: number
          product_id: string
          product_name: string
          sku: string
          storage_fees: number
          total_cogs: number
          transfer_cost: number
          units_sold: number
        }[]
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
      get_cogs_settings: {
        Args: { p_name?: string }
        Returns: {
          created_at: string
          custom_inclusions: Json | null
          description: string | null
          export_decimal_places: number | null
          export_format: string | null
          export_include_headers: boolean | null
          id: string
          include_advertising: boolean
          include_assembly_costs: boolean
          include_awd_processing: boolean
          include_awd_storage: boolean
          include_awd_transportation: boolean
          include_damaged_lost: boolean
          include_disposed: boolean
          include_duties_taxes: boolean
          include_fba_fulfillment: boolean
          include_fba_labeling: boolean
          include_fba_prep: boolean
          include_fba_storage: boolean
          include_inbound_placement: boolean
          include_inbound_transportation: boolean
          include_product_cost: boolean
          include_referral_fees: boolean
          include_shipping_to_amazon: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cogs_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_current_user_info: {
        Args: never
        Returns: {
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_documents_summary: {
        Args: never
        Returns: {
          inspections: number
          purchase_orders: number
          this_month: number
          total: number
          transfers: number
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
      process_pending_sales_attribution: {
        Args: never
        Returns: {
          attributed_quantity: number
          order_item_id: string
          requested_quantity: number
          seller_sku: string
          unattributed_quantity: number
        }[]
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
      amazon_fee_type:
        | "fba_fulfillment"
        | "fba_storage_monthly"
        | "fba_storage_long_term"
        | "fba_removal"
        | "fba_disposal"
        | "fba_prep"
        | "fba_labeling"
        | "inbound_placement"
        | "inbound_defect"
        | "inbound_transportation"
        | "awd_storage"
        | "awd_processing"
        | "awd_transportation"
        | "referral_fee"
        | "sponsored_products"
        | "sponsored_brands"
        | "sponsored_display"
        | "reimbursement"
        | "refund_admin"
        | "other"
      amazon_inbound_type: "FBA" | "AWD"
      amazon_mapping_status: "mapped" | "unmapped" | "pending"
      amazon_marketplace: "US" | "CA" | "MX"
      amazon_order_status:
        | "pending"
        | "unshipped"
        | "partially_shipped"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "unfulfillable"
      amazon_receiving_status:
        | "checked-in"
        | "receiving"
        | "received"
        | "closed"
      amazon_sales_channel: "FBA" | "FBM" | "AWD_TRANSFER"
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
      document_source_type: "purchase-order" | "inspection" | "transfer"
      fee_allocation_method: "direct" | "prorate_quantity" | "prorate_value"
      fee_attribution_level: "order_item" | "shipment" | "product" | "account"
      generated_document_type:
        | "purchase-order-pdf"
        | "inspection-brief"
        | "shipping-manifest"
        | "packing-list"
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
      inventory_loss_type:
        | "damaged_inbound"
        | "damaged_warehouse"
        | "damaged_customer"
        | "lost_inbound"
        | "lost_warehouse"
        | "disposed"
        | "expired"
        | "recalled"
        | "write_off"
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
      reimbursement_status:
        | "none"
        | "pending"
        | "partial"
        | "complete"
        | "denied"
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
      amazon_fee_type: [
        "fba_fulfillment",
        "fba_storage_monthly",
        "fba_storage_long_term",
        "fba_removal",
        "fba_disposal",
        "fba_prep",
        "fba_labeling",
        "inbound_placement",
        "inbound_defect",
        "inbound_transportation",
        "awd_storage",
        "awd_processing",
        "awd_transportation",
        "referral_fee",
        "sponsored_products",
        "sponsored_brands",
        "sponsored_display",
        "reimbursement",
        "refund_admin",
        "other",
      ],
      amazon_inbound_type: ["FBA", "AWD"],
      amazon_mapping_status: ["mapped", "unmapped", "pending"],
      amazon_marketplace: ["US", "CA", "MX"],
      amazon_order_status: [
        "pending",
        "unshipped",
        "partially_shipped",
        "shipped",
        "delivered",
        "cancelled",
        "unfulfillable",
      ],
      amazon_receiving_status: [
        "checked-in",
        "receiving",
        "received",
        "closed",
      ],
      amazon_sales_channel: ["FBA", "FBM", "AWD_TRANSFER"],
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
      document_source_type: ["purchase-order", "inspection", "transfer"],
      fee_allocation_method: ["direct", "prorate_quantity", "prorate_value"],
      fee_attribution_level: ["order_item", "shipment", "product", "account"],
      generated_document_type: [
        "purchase-order-pdf",
        "inspection-brief",
        "shipping-manifest",
        "packing-list",
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
      inventory_loss_type: [
        "damaged_inbound",
        "damaged_warehouse",
        "damaged_customer",
        "lost_inbound",
        "lost_warehouse",
        "disposed",
        "expired",
        "recalled",
        "write_off",
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
      reimbursement_status: [
        "none",
        "pending",
        "partial",
        "complete",
        "denied",
      ],
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
// Custom Type Aliases for backwards compatibility
// =============================================================================

// Batch types
export type DbBatch = Database['public']['Tables']['batches']['Row']
export type DbBatchInsert = Database['public']['Tables']['batches']['Insert']
export type DbBatchUpdate = Database['public']['Tables']['batches']['Update']

// Product types
export type DbProduct = Database['public']['Tables']['products']['Row']
export type DbProductInsert = Database['public']['Tables']['products']['Insert']
export type DbProductUpdate = Database['public']['Tables']['products']['Update']

// Product SKU types
export type DbProductSku = Database['public']['Tables']['product_skus']['Row']
export type DbProductSkuInsert = Database['public']['Tables']['product_skus']['Insert']
export type DbProductSkuUpdate = Database['public']['Tables']['product_skus']['Update']

// Supplier types
export type DbSupplier = Database['public']['Tables']['suppliers']['Row']
export type DbSupplierInsert = Database['public']['Tables']['suppliers']['Insert']
export type DbSupplierUpdate = Database['public']['Tables']['suppliers']['Update']

// Purchase Order types
export type DbPurchaseOrder = Database['public']['Tables']['purchase_orders']['Row']
export type DbPurchaseOrderInsert = Database['public']['Tables']['purchase_orders']['Insert']
export type DbPurchaseOrderUpdate = Database['public']['Tables']['purchase_orders']['Update']

// PO Line Item types
export type DbPOLineItem = Database['public']['Tables']['po_line_items']['Row']
export type DbPOLineItemInsert = Database['public']['Tables']['po_line_items']['Insert']
export type DbPOLineItemUpdate = Database['public']['Tables']['po_line_items']['Update']

// Transfer types
export type DbTransfer = Database['public']['Tables']['transfers']['Row']
export type DbTransferInsert = Database['public']['Tables']['transfers']['Insert']
export type DbTransferUpdate = Database['public']['Tables']['transfers']['Update']

// Transfer Line Item types
export type DbTransferLineItem = Database['public']['Tables']['transfer_line_items']['Row']
export type DbTransferLineItemInsert = Database['public']['Tables']['transfer_line_items']['Insert']
export type DbTransferLineItemUpdate = Database['public']['Tables']['transfer_line_items']['Update']

// Work Order types
export type DbWorkOrder = Database['public']['Tables']['work_orders']['Row']
export type DbWorkOrderInsert = Database['public']['Tables']['work_orders']['Insert']
export type DbWorkOrderUpdate = Database['public']['Tables']['work_orders']['Update']

// Work Order Cost types
export type DbWorkOrderCost = Database['public']['Tables']['work_order_costs']['Row']
export type DbWorkOrderCostInsert = Database['public']['Tables']['work_order_costs']['Insert']
export type DbWorkOrderCostUpdate = Database['public']['Tables']['work_order_costs']['Update']

// Work Order Component types
export type DbWorkOrderComponent = Database['public']['Tables']['work_order_components']['Row']
export type DbWorkOrderComponentInsert = Database['public']['Tables']['work_order_components']['Insert']
export type DbWorkOrderComponentUpdate = Database['public']['Tables']['work_order_components']['Update']

// Location types
export type DbLocation = Database['public']['Tables']['locations']['Row']
export type DbLocationInsert = Database['public']['Tables']['locations']['Insert']
export type DbLocationUpdate = Database['public']['Tables']['locations']['Update']

// Amazon Order types
export type DbAmazonOrder = Database['public']['Tables']['amazon_orders']['Row']
export type DbAmazonOrderInsert = Database['public']['Tables']['amazon_orders']['Insert']
export type DbAmazonOrderUpdate = Database['public']['Tables']['amazon_orders']['Update']

// Amazon Order Item types
export type DbAmazonOrderItem = Database['public']['Tables']['amazon_order_items']['Row']
export type DbAmazonOrderItemInsert = Database['public']['Tables']['amazon_order_items']['Insert']
export type DbAmazonOrderItemUpdate = Database['public']['Tables']['amazon_order_items']['Update']

// Amazon Fee types
export type DbAmazonFee = Database['public']['Tables']['amazon_fees']['Row']
export type DbAmazonFeeInsert = Database['public']['Tables']['amazon_fees']['Insert']
export type DbAmazonFeeUpdate = Database['public']['Tables']['amazon_fees']['Update']

// Amazon Fee Allocation types
export type DbAmazonFeeAllocation = Database['public']['Tables']['amazon_fee_allocations']['Row']
export type DbAmazonFeeAllocationInsert = Database['public']['Tables']['amazon_fee_allocations']['Insert']
export type DbAmazonFeeAllocationUpdate = Database['public']['Tables']['amazon_fee_allocations']['Update']

// Inventory Loss types
export type DbInventoryLoss = Database['public']['Tables']['inventory_losses']['Row']
export type DbInventoryLossInsert = Database['public']['Tables']['inventory_losses']['Insert']
export type DbInventoryLossUpdate = Database['public']['Tables']['inventory_losses']['Update']

// COGS Settings types
export type DbCOGSSettings = Database['public']['Tables']['cogs_settings']['Row']
export type DbCOGSSettingsInsert = Database['public']['Tables']['cogs_settings']['Insert']
export type DbCOGSSettingsUpdate = Database['public']['Tables']['cogs_settings']['Update']

// Sales Batch Attribution types
export type DbSalesBatchAttribution = Database['public']['Tables']['sales_batch_attributions']['Row']
export type DbSalesBatchAttributionInsert = Database['public']['Tables']['sales_batch_attributions']['Insert']
export type DbSalesBatchAttributionUpdate = Database['public']['Tables']['sales_batch_attributions']['Update']

// Inspection types
export type DbInspection = Database['public']['Tables']['inspections']['Row']
export type DbInspectionInsert = Database['public']['Tables']['inspections']['Insert']
export type DbInspectionUpdate = Database['public']['Tables']['inspections']['Update']

// Inspection Line Item types
export type DbInspectionLineItem = Database['public']['Tables']['inspection_line_items']['Row']
export type DbInspectionLineItemInsert = Database['public']['Tables']['inspection_line_items']['Insert']
export type DbInspectionLineItemUpdate = Database['public']['Tables']['inspection_line_items']['Update']

// Inspection Agent types
export type DbInspectionAgent = Database['public']['Tables']['inspection_agents']['Row']
export type DbInspectionAgentInsert = Database['public']['Tables']['inspection_agents']['Insert']
export type DbInspectionAgentUpdate = Database['public']['Tables']['inspection_agents']['Update']

// BOM types
export type DbBOM = Database['public']['Tables']['boms']['Row']
export type DbBOMInsert = Database['public']['Tables']['boms']['Insert']
export type DbBOMUpdate = Database['public']['Tables']['boms']['Update']

// BOM Line Item types
export type DbBOMLineItem = Database['public']['Tables']['bom_line_items']['Row']
export type DbBOMLineItemInsert = Database['public']['Tables']['bom_line_items']['Insert']
export type DbBOMLineItemUpdate = Database['public']['Tables']['bom_line_items']['Update']

// Invoice types
export type DbInvoice = Database['public']['Tables']['invoices']['Row']
export type DbInvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type DbInvoiceUpdate = Database['public']['Tables']['invoices']['Update']

// Invoice Payments types
export type DbInvoicePayment = Database['public']['Tables']['invoice_payments']['Row']
export type DbInvoicePaymentInsert = Database['public']['Tables']['invoice_payments']['Insert']
export type DbInvoicePaymentUpdate = Database['public']['Tables']['invoice_payments']['Update']

// Batch Stage History types
export type DbBatchStageHistory = Database['public']['Tables']['batch_stage_history']['Row']
export type DbBatchStageHistoryInsert = Database['public']['Tables']['batch_stage_history']['Insert']
export type DbBatchStageHistoryUpdate = Database['public']['Tables']['batch_stage_history']['Update']

// Batch Attachments types
export type DbBatchAttachment = Database['public']['Tables']['batch_attachments']['Row']
export type DbBatchAttachmentInsert = Database['public']['Tables']['batch_attachments']['Insert']
export type DbBatchAttachmentUpdate = Database['public']['Tables']['batch_attachments']['Update']

// Brand types
export type DbBrand = Database['public']['Tables']['brands']['Row']
export type DbBrandInsert = Database['public']['Tables']['brands']['Insert']
export type DbBrandUpdate = Database['public']['Tables']['brands']['Update']

// Enum types
export type BatchStage = Database['public']['Enums']['batch_stage']
export type POStatus = Database['public']['Enums']['po_status']
export type TransferStatus = Database['public']['Enums']['transfer_status']
export type WorkOrderStatus = Database['public']['Enums']['work_order_status']
export type WorkOrderCostType = Database['public']['Enums']['work_order_cost_type']
export type AmazonFeeType = Database['public']['Enums']['amazon_fee_type']
export type FeeAttributionLevel = Database['public']['Enums']['fee_attribution_level']
export type InventoryLossType = Database['public']['Enums']['inventory_loss_type']
export type ReimbursementStatus = Database['public']['Enums']['reimbursement_status']
export type ProductType = Database['public']['Enums']['product_type']
export type BrandStatus = Database['public']['Enums']['brand_status']
export type InspectionStatus = Database['public']['Enums']['inspection_status']
export type LocationType = Database['public']['Enums']['location_type']
export type ProductStatus = Database['public']['Enums']['product_status']
export type MessageDirection = Database['public']['Enums']['message_direction']

// Additional table types
export type DbInspectionDefect = Database['public']['Tables']['inspection_defects']['Row']
export type DbInspectionDefectInsert = Database['public']['Tables']['inspection_defects']['Insert']
export type DbInspectionDefectUpdate = Database['public']['Tables']['inspection_defects']['Update']

export type DbInspectionMeasurement = Database['public']['Tables']['inspection_measurements']['Row']
export type DbInspectionMeasurementInsert = Database['public']['Tables']['inspection_measurements']['Insert']
export type DbInspectionMeasurementUpdate = Database['public']['Tables']['inspection_measurements']['Update']

export type DbInspectionPhoto = Database['public']['Tables']['inspection_photos']['Row']
export type DbInspectionPhotoInsert = Database['public']['Tables']['inspection_photos']['Insert']
export type DbInspectionPhotoUpdate = Database['public']['Tables']['inspection_photos']['Update']

export type DbReworkRequest = Database['public']['Tables']['rework_requests']['Row']
export type DbReworkRequestInsert = Database['public']['Tables']['rework_requests']['Insert']
export type DbReworkRequestUpdate = Database['public']['Tables']['rework_requests']['Update']

export type DbInspectionMessage = Database['public']['Tables']['inspection_messages']['Row']
export type DbInspectionMessageInsert = Database['public']['Tables']['inspection_messages']['Insert']
export type DbInspectionMessageUpdate = Database['public']['Tables']['inspection_messages']['Update']

export type DbInspectionMessageAttachment = Database['public']['Tables']['inspection_message_attachments']['Row']
export type DbInspectionMessageAttachmentInsert = Database['public']['Tables']['inspection_message_attachments']['Insert']
export type DbInspectionMessageAttachmentUpdate = Database['public']['Tables']['inspection_message_attachments']['Update']

export type DbInvoicePaymentScheduleItem = Database['public']['Tables']['invoice_payment_schedule_items']['Row']
export type DbInvoicePaymentScheduleItemInsert = Database['public']['Tables']['invoice_payment_schedule_items']['Insert']
export type DbInvoicePaymentScheduleItemUpdate = Database['public']['Tables']['invoice_payment_schedule_items']['Update']

export type DbInvoicePaymentAttachment = Database['public']['Tables']['invoice_payment_attachments']['Row']
export type DbInvoicePaymentAttachmentInsert = Database['public']['Tables']['invoice_payment_attachments']['Insert']
export type DbInvoicePaymentAttachmentUpdate = Database['public']['Tables']['invoice_payment_attachments']['Update']

export type DbPaymentTermsTemplate = Database['public']['Tables']['payment_terms_templates']['Row']
export type DbPaymentTermsTemplateInsert = Database['public']['Tables']['payment_terms_templates']['Insert']
export type DbPaymentTermsTemplateUpdate = Database['public']['Tables']['payment_terms_templates']['Update']

export type DbPOMessage = Database['public']['Tables']['po_messages']['Row']
export type DbPOMessageInsert = Database['public']['Tables']['po_messages']['Insert']
export type DbPOMessageUpdate = Database['public']['Tables']['po_messages']['Update']

export type DbPOAttachment = Database['public']['Tables']['po_attachments']['Row']
export type DbPOAttachmentInsert = Database['public']['Tables']['po_attachments']['Insert']
export type DbPOAttachmentUpdate = Database['public']['Tables']['po_attachments']['Update']

export type DbPOStatusHistory = Database['public']['Tables']['po_status_history']['Row']
export type DbPOStatusHistoryInsert = Database['public']['Tables']['po_status_history']['Insert']
export type DbPOStatusHistoryUpdate = Database['public']['Tables']['po_status_history']['Update']

export type DbProductSpecSheet = Database['public']['Tables']['product_spec_sheets']['Row']
export type DbProductSpecSheetInsert = Database['public']['Tables']['product_spec_sheets']['Insert']
export type DbProductSpecSheetUpdate = Database['public']['Tables']['product_spec_sheets']['Update']

// Alias for compatibility
export type DbProductSKU = Database['public']['Tables']['product_skus']['Row']
export type DbProductSKUInsert = Database['public']['Tables']['product_skus']['Insert']
export type DbProductSKUUpdate = Database['public']['Tables']['product_skus']['Update']

// Additional table types
export type DbPODocument = Database['public']['Tables']['po_documents']['Row']
export type DbPODocumentInsert = Database['public']['Tables']['po_documents']['Insert']
export type DbPODocumentUpdate = Database['public']['Tables']['po_documents']['Update']

export type DbStockLedgerEntry = Database['public']['Tables']['stock_ledger_entries']['Row']
export type DbStockLedgerEntryInsert = Database['public']['Tables']['stock_ledger_entries']['Insert']
export type DbStockLedgerEntryUpdate = Database['public']['Tables']['stock_ledger_entries']['Update']

// View types (for read-only access)
export type DbFinancialSummary = Database['public']['Views']['financial_summary']['Row']
export type DbStockByLocation = Database['public']['Views']['stock_by_location']['Row']
export type DbStockByProduct = Database['public']['Views']['stock_by_product']['Row']

// Additional enum types
export type StockMovementType = Database['public']['Enums']['stock_movement_type']
export type SupplierStatus = Database['public']['Enums']['supplier_status']
export type InvoiceType = Database['public']['Enums']['invoice_type']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type LinkedEntityType = Database['public']['Enums']['linked_entity_type']
export type PaymentMethod = Database['public']['Enums']['payment_method']
export type InvoiceCreationMethod = Database['public']['Enums']['invoice_creation_method']
export type PaymentTriggerStatus = Database['public']['Enums']['payment_trigger_status']
export type PaymentMilestoneTrigger = Database['public']['Enums']['payment_milestone_trigger']
