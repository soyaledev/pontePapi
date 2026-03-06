export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: {
          barber_id: string | null;
          barbershop_id: string;
          cliente_email: string | null;
          cliente_instagram: string | null;
          cliente_nombre: string;
          cliente_telefono: string;
          created_at: string | null;
          estado: Database["public"]["Enums"]["appointment_status"] | null;
          fecha: string;
          id: string;
          monto_sena_pagado: number | null;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          service_id: string;
          slot_time: string;
          updated_at: string | null;
        };
        Insert: {
          barber_id?: string | null;
          barbershop_id: string;
          cliente_email?: string | null;
          cliente_instagram?: string | null;
          cliente_nombre: string;
          cliente_telefono: string;
          created_at?: string | null;
          estado?: Database["public"]["Enums"]["appointment_status"] | null;
          fecha: string;
          id?: string;
          monto_sena_pagado?: number | null;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          service_id: string;
          slot_time: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
      };
      barbers: {
        Row: {
          barbershop_id: string;
          created_at: string | null;
          id: string;
          name: string;
          order: number | null;
          photo_url: string | null;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          photo_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["barbers"]["Insert"]>;
      };
      barbershops: {
        Row: {
          address: string | null;
          barberos: string[] | null;
          city: string | null;
          created_at: string | null;
          id: string;
          monto_sena: number | null;
          mp_access_token: string | null;
          mp_refresh_token: string | null;
          mp_user_id: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          photo_url: string | null;
          requiere_sena: boolean | null;
          sena_comision_cliente: boolean | null;
          sena_opcional: boolean | null;
          slot_minutes: number | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          barberos?: string[] | null;
          city?: string | null;
          created_at?: string | null;
          id?: string;
          monto_sena?: number | null;
          mp_access_token?: string | null;
          mp_refresh_token?: string | null;
          mp_user_id?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          photo_url?: string | null;
          requiere_sena?: boolean | null;
          sena_comision_cliente?: boolean | null;
          sena_opcional?: boolean | null;
          slot_minutes?: number | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["barbershops"]["Insert"]>;
      };
      owner_profiles: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id: string;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["owner_profiles"]["Insert"]>;
      };
      schedules: {
        Row: {
          barbershop_id: string;
          close_time: string;
          created_at: string | null;
          day_of_week: number;
          id: string;
          open_time: string;
        };
        Insert: {
          barbershop_id: string;
          close_time: string;
          created_at?: string | null;
          day_of_week: number;
          id?: string;
          open_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["schedules"]["Insert"]>;
      };
      services: {
        Row: {
          barbershop_id: string;
          created_at: string | null;
          duracion_min: number;
          id: string;
          name: string;
          price: number;
          updated_at: string | null;
        };
        Insert: {
          barbershop_id: string;
          created_at?: string | null;
          duracion_min?: number;
          id?: string;
          name: string;
          price: number;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
    };
    Enums: {
      appointment_status: "pending" | "pending_payment" | "confirmed" | "cancelled" | "completed";
    };
  };
};
