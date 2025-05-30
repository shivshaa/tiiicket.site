import { supabase } from "@/lib/supabaseClient"

export interface UserProfileData {
  email: string
  username: string
  wallet_address: string
  created_at?: string
  bio?: string
  avatar_url?: string
}

export const getUserProfile = async (walletAddress: string): Promise<UserProfileData | null> => {
  try {
    const { data, error } = await supabase
      .from("user_data")
      .select("*")
      .eq("wallet_address", walletAddress.toLowerCase())
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No user found
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }
}

export const createUserProfile = async (profileData: UserProfileData): Promise<UserProfileData> => {
  try {
    const { data, error } = await supabase
      .from("user_data")
      .insert([
        {
          ...profileData,
          wallet_address: profileData.wallet_address.toLowerCase(),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

export const updateUserProfile = async (
  walletAddress: string,
  updates: Partial<UserProfileData>,
): Promise<UserProfileData> => {
  try {
    const { data, error } = await supabase
      .from("user_data")
      .update(updates)
      .eq("wallet_address", walletAddress.toLowerCase())
      .select()
      .single()

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export const getUserTicketsWithEvents = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select(`
        ticket_id,
        event_id,
        owner_address,
        price,
        category,
        token_id,
        purchase_date,
        seat_info,
        for_sale,
        resale_price,
        event_data:event_id (
          name,
          date,
          time,
          location,
          event_image_url,
          category,
          organizer_id
        )
      `)
      .eq("owner_address", walletAddress.toLowerCase())
      .order("purchase_date", { ascending: false })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching user tickets:", error)
    throw error
  }
}
