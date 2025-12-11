export type Database = {
  public: {
    Tables: {
      ads_performance: {
        Row: {
          id: string
          ad_id: string
          ad_name: string
          campaign_name: string | null
          destination: string | null
          angle: string | null
          format: string | null
          impressions: number
          clicks: number
          spend: number
          conversions: number
          revenue: number
          ctr: number
          cpa: number
          roas: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ad_id: string
          ad_name: string
          campaign_name?: string | null
          destination?: string | null
          angle?: string | null
          format?: string | null
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          revenue?: number
          ctr?: number
          cpa?: number
          roas?: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ad_id?: string
          ad_name?: string
          campaign_name?: string | null
          destination?: string | null
          angle?: string | null
          format?: string | null
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          revenue?: number
          ctr?: number
          cpa?: number
          roas?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      creatives: {
        Row: {
          id: string
          name: string
          file_url: string
          file_type: string
          angle: string | null
          destination: string | null
          format: string | null
          campaign: string | null
          status: string
          notes: string | null
          status_history: any
          created_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          file_url: string
          file_type: string
          angle?: string | null
          destination?: string | null
          format?: string | null
          campaign?: string | null
          status?: string
          notes?: string | null
          status_history?: any
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          file_url?: string
          file_type?: string
          angle?: string | null
          destination?: string | null
          format?: string | null
          campaign?: string | null
          status?: string
          notes?: string | null
          status_history?: any
          created_at?: string
          updated_at?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
