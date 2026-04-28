export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "user" | "organizer" | "admin" | "superadmin";
export type EventStatus = "draft" | "published" | "live" | "limited" | "soon" | "cancelled" | "archived";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled";
export type TicketStatus = "reserved" | "active" | "used";
export type PaymentStatus = "pending" | "paid" | "failed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          wallet_address: string | null;
          telegram_username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          wallet_address?: string | null;
          telegram_username?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          wallet_address?: string | null;
          telegram_username?: string | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          date: string | null;
          city: string | null;
          venue: string | null;
          address: string | null;
          price: number;
          currency: string;
          capacity: number;
          status: EventStatus;
          image_url: string | null;
          organizer_id: string | null;
          organizer_name: string | null;
          organizer_description: string | null;
          organizer_contact: string | null;
          telegram_url: string | null;
          lineup: string;
          tags: string;
          age_limit: string | null;
          dress_code: string | null;
          doors_open: string | null;
          event_type: string | null;
          ticket_wave_label: string | null;
          urgency_note: string | null;
          referral_enabled: boolean;
          wallet_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          date?: string | null;
          city?: string | null;
          venue?: string | null;
          address?: string | null;
          price?: number;
          currency?: string;
          capacity?: number;
          status?: EventStatus;
          image_url?: string | null;
          organizer_id?: string | null;
          organizer_name?: string | null;
          organizer_description?: string | null;
          organizer_contact?: string | null;
          telegram_url?: string | null;
          lineup?: string;
          tags?: string;
          age_limit?: string | null;
          dress_code?: string | null;
          doors_open?: string | null;
          event_type?: string | null;
          ticket_wave_label?: string | null;
          urgency_note?: string | null;
          referral_enabled?: boolean;
          wallet_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          date?: string | null;
          city?: string | null;
          venue?: string | null;
          address?: string | null;
          price?: number;
          currency?: string;
          capacity?: number;
          status?: EventStatus;
          image_url?: string | null;
          organizer_id?: string | null;
          organizer_name?: string | null;
          organizer_description?: string | null;
          organizer_contact?: string | null;
          telegram_url?: string | null;
          lineup?: string;
          tags?: string;
          age_limit?: string | null;
          dress_code?: string | null;
          doors_open?: string | null;
          event_type?: string | null;
          ticket_wave_label?: string | null;
          urgency_note?: string | null;
          referral_enabled?: boolean;
          wallet_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string | null;
          name: string | null;
          email: string | null;
          telegram_username: string | null;
          telegram_user_id: string | null;
          referral_code: string | null;
          status: RegistrationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id?: string | null;
          name?: string | null;
          email?: string | null;
          telegram_username?: string | null;
          telegram_user_id?: string | null;
          referral_code?: string | null;
          status?: RegistrationStatus;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          name?: string | null;
          email?: string | null;
          telegram_username?: string | null;
          telegram_user_id?: string | null;
          referral_code?: string | null;
          status?: RegistrationStatus;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tickets: {
        Row: {
          id: string;
          registration_id: string | null;
          event_id: string;
          user_id: string | null;
          ticket_code: string;
          qr_payload: string | null;
          status: TicketStatus;
          payment_status: PaymentStatus;
          checked_in: boolean;
          checked_in_at: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          registration_id?: string | null;
          event_id: string;
          user_id?: string | null;
          ticket_code: string;
          qr_payload?: string | null;
          status?: TicketStatus;
          payment_status?: PaymentStatus;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          registration_id?: string | null;
          event_id?: string;
          user_id?: string | null;
          ticket_code?: string;
          qr_payload?: string | null;
          status?: TicketStatus;
          payment_status?: PaymentStatus;
          checked_in?: boolean;
          checked_in_at?: string | null;
          checked_in_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_checked_in_by_fkey";
            columns: ["checked_in_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      referrals: {
        Row: {
          id: string;
          event_id: string | null;
          code: string;
          owner_user_id: string | null;
          clicks: number;
          registrations: number;
          confirmed: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          code: string;
          owner_user_id?: string | null;
          clicks?: number;
          registrations?: number;
          confirmed?: number;
          created_at?: string;
        };
        Update: {
          event_id?: string | null;
          owner_user_id?: string | null;
          code?: string;
          clicks?: number;
          registrations?: number;
          confirmed?: number;
        };
        Relationships: [
          {
            foreignKeyName: "referrals_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "referrals_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      telegram_registration_sessions: {
        Row: {
          id: string;
          telegram_user_id: string;
          chat_id: string;
          event_id: string | null;
          event_slug: string | null;
          step: string;
          name: string | null;
          phone: string | null;
          position_company: string | null;
          industry: string | null;
          telegram_username: string | null;
          language: string;
          registration_id: string | null;
          ticket_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_user_id: string;
          chat_id: string;
          event_id?: string | null;
          event_slug?: string | null;
          step?: string;
          name?: string | null;
          phone?: string | null;
          position_company?: string | null;
          industry?: string | null;
          telegram_username?: string | null;
          language?: string;
          registration_id?: string | null;
          ticket_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          telegram_user_id?: string;
          chat_id?: string;
          event_id?: string | null;
          event_slug?: string | null;
          step?: string;
          name?: string | null;
          phone?: string | null;
          position_company?: string | null;
          industry?: string | null;
          telegram_username?: string | null;
          language?: string;
          registration_id?: string | null;
          ticket_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "telegram_registration_sessions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "telegram_registration_sessions_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "registrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "telegram_registration_sessions_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          }
        ];
      };
      telegram_users: {
        Row: {
          id: string;
          telegram_user_id: string;
          chat_id: string;
          username: string | null;
          first_name: string | null;
          last_name: string | null;
          profile_id: string | null;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_user_id: string;
          chat_id: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          profile_id?: string | null;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          telegram_user_id?: string;
          chat_id?: string;
          username?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          profile_id?: string | null;
          language?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "telegram_users_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      has_role: {
        Args: { required_roles: UserRole[] };
        Returns: boolean;
      };
      get_event_registration_count: {
        Args: { event_id_input: string };
        Returns: number;
      };
      check_in_ticket: {
        Args: { ticket_code_input: string };
        Returns: {
          ticket_id: string;
          event_id: string;
          event_title: string;
          ticket_code: string;
          status: TicketStatus;
          payment_status: PaymentStatus;
          checked_in: boolean;
          checked_in_at: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
