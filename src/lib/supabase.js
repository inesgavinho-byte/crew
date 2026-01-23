import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Auth helpers
export const signUp = async (email, password, username) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
      }
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Profile helpers
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
  return { data, error }
}

// Crews helpers
export const getMyCrews = async () => {
  const user = await getCurrentUser()
  console.log('getMyCrews - user:', user?.id)
  if (!user) return { data: [], error: null }
  
  // Try nested select first
  let { data, error } = await supabase
    .from('crew_members')
    .select(`
      crew_id,
      role,
      status,
      crews (
        id,
        name,
        emoji,
        description,
        sport
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
  
  console.log('getMyCrews - nested result:', { data, error })
  
  // If nested select fails or returns empty crews, fetch separately
  if (data && data.length > 0 && !data[0].crews) {
    console.log('Nested select failed, fetching crews separately')
    const crewIds = data.map(d => d.crew_id)
    const { data: crewsData } = await supabase
      .from('crews')
      .select('*')
      .in('id', crewIds)
    
    // Merge the data
    data = data.map(d => ({
      ...d,
      crews: crewsData?.find(c => c.id === d.crew_id) || null
    }))
    console.log('getMyCrews - merged result:', data)
  }
  
  return { data, error }
}

export const createCrew = async (name, emoji, description, sport) => {
  console.log('createCrew called:', { name, emoji, description, sport })
  
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Got user:', user?.id)
  
  if (!user) return { data: null, error: { message: 'Not authenticated' } }
  
  // Create crew
  console.log('Inserting crew...')
  const { data: crewData, error: crewError } = await supabase
    .from('crews')
    .insert({
      name: name,
      emoji: emoji || '🌊',
      description: description,
      sport: sport || 'surf',
      created_by: user.id
    })
    .select()
    .single()
  
  console.log('Crew insert result:', { crewData, crewError })
  
  if (crewError) {
    console.error('Crew insert error:', crewError)
    return { data: null, error: crewError }
  }
  
  // Add creator as admin
  console.log('Inserting member...')
  const { error: memberError } = await supabase
    .from('crew_members')
    .insert({
      crew_id: crewData.id,
      user_id: user.id,
      role: 'admin',
      status: 'active'
    })
  
  console.log('Member insert error:', memberError)
  
  return { data: crewData.id, error: null }
}

export const getCrewMembers = async (crewId) => {
  const { data, error } = await supabase
    .from('crew_members_view')
    .select('*')
    .eq('crew_id', crewId)
  return { data, error }
}

export const inviteToCrew = async (crewId, userId) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('crew_members')
    .insert({
      crew_id: crewId,
      user_id: userId,
      status: 'pending',
      invited_by: user.id
    })
  return { data, error }
}

// Voting helpers
export const getPendingMembers = async (crewId) => {
  const { data, error } = await supabase
    .from('crew_members_view')
    .select('*')
    .eq('crew_id', crewId)
    .eq('status', 'pending')
  return { data, error }
}

export const getVotesForCandidate = async (crewId, candidateId) => {
  const { data, error } = await supabase
    .from('crew_votes')
    .select('*')
    .eq('crew_id', crewId)
    .eq('candidate_id', candidateId)
  return { data, error }
}

export const castVote = async (crewId, candidateId, vote) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('crew_votes')
    .insert({
      crew_id: crewId,
      candidate_id: candidateId,
      voter_id: user.id,
      vote: vote // 'yes' or 'no'
    })
  return { data, error }
}

// Signals helpers
export const getSignalsFeed = async (crewIds) => {
  // Get signals
  const { data: signalsData, error: signalsError } = await supabase
    .from('signals')
    .select('*')
    .in('crew_id', crewIds)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (signalsError || !signalsData) return { data: [], error: signalsError }
  
  // Get user profiles
  const userIds = [...new Set(signalsData.map(s => s.user_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)
  
  // Get crew info (including sport)
  const { data: crewsData } = await supabase
    .from('crews')
    .select('id, name, sport')
    .in('id', crewIds)
  
  // Merge data
  const signals = signalsData.map(s => ({
    ...s,
    username: profilesData?.find(p => p.id === s.user_id)?.username || 'Unknown',
    crew_name: crewsData?.find(c => c.id === s.crew_id)?.name || 'Unknown',
    crew_sport: crewsData?.find(c => c.id === s.crew_id)?.sport || 'surf'
  }))
  
  return { data: signals, error: null }
}

export const createSignal = async (crewId, spotName, condition, size, wind, crowd, note) => {
  const user = await getCurrentUser()
    
  const { data, error } = await supabase
    .from('signals')
    .insert({
      user_id: user.id,
      crew_id: crewId,
      spot_name: spotName,
      condition: condition,
      size: size,
      wind: wind,
      crowd: crowd,
      note: note
    })
    .select()
    .single()
  return { data, error }
}

// Spots helpers
export const getSpots = async () => {
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('name')
  return { data, error }
}

// Realtime subscriptions
export const subscribeToSignals = (crewIds, callback) => {
  return supabase
    .channel('signals')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'signals',
        filter: `crew_id=in.(${crewIds.join(',')})`
      },
      callback
    )
    .subscribe()
}

export const subscribeToVotes = (crewId, callback) => {
  return supabase
    .channel('votes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'crew_votes',
        filter: `crew_id=eq.${crewId}`
      },
      callback
    )
    .subscribe()
}

// Storage helpers
export const uploadImage = async (file, folder = 'photos') => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName)
  
  return publicUrl
}

export const deleteImage = async (url) => {
  // Extract path from URL
  const path = url.split('/uploads/')[1]
  if (!path) return
  
  const { error } = await supabase.storage
    .from('uploads')
    .remove([path])
  
  if (error) throw error
}

// ============ CHAT FUNCTIONS ============

export const getChatMessages = async (crewId, limit = 50) => {
  return await supabase
    .from('chat_messages')
    .select('*')
    .eq('crew_id', crewId)
    .order('created_at', { ascending: false })
    .limit(limit)
}

export const sendChatMessage = async (crewId, userId, username, message) => {
  return await supabase
    .from('chat_messages')
    .insert({
      crew_id: crewId,
      user_id: userId,
      username,
      type: 'text',
      content: message
    })
    .select()
    .single()
}

export const sendPhotoMessage = async (crewId, userId, username, photoUrl, caption) => {
  return await supabase
    .from('chat_messages')
    .insert({
      crew_id: crewId,
      user_id: userId,
      username,
      type: 'photo',
      photo_url: photoUrl,
      content: caption || null
    })
    .select()
    .single()
}

export const sendLocationMessage = async (crewId, userId, username, spotName) => {
  return await supabase
    .from('chat_messages')
    .insert({
      crew_id: crewId,
      user_id: userId,
      username,
      type: 'location',
      spot_name: spotName
    })
    .select()
    .single()
}

export const sendPollMessage = async (crewId, userId, username, question) => {
  return await supabase
    .from('chat_messages')
    .insert({
      crew_id: crewId,
      user_id: userId,
      username,
      type: 'poll',
      poll_question: question,
      poll_responses: []
    })
    .select()
    .single()
}

export const respondToPoll = async (messageId, oldResponses, userId, username, response) => {
  // Remove existing response from this user
  const filtered = oldResponses.filter(r => r.user_id !== userId)
  // Add new response
  const newResponses = [...filtered, { user_id: userId, username, response }]
  
  return await supabase
    .from('chat_messages')
    .update({ poll_responses: newResponses })
    .eq('id', messageId)
}

export const subscribeToChatMessages = (crewId, callback) => {
  return supabase
    .channel(`chat:${crewId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `crew_id=eq.${crewId}`
      },
      (payload) => callback(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `crew_id=eq.${crewId}`
      },
      (payload) => callback(payload.new, 'update')
    )
    .subscribe()
}

// ============ BOARD MARKET FUNCTIONS ============

export const getListings = async (filters = {}) => {
  let query = supabase
    .from('board_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (filters.board_type) {
    query = query.eq('board_type', filters.board_type)
  }
  if (filters.condition) {
    query = query.eq('condition', filters.condition)
  }
  if (filters.minPrice) {
    query = query.gte('price', filters.minPrice)
  }
  if (filters.maxPrice) {
    query = query.lte('price', filters.maxPrice)
  }
  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  return await query.limit(50)
}

export const getMyListings = async (userId) => {
  return await supabase
    .from('board_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const getListing = async (listingId) => {
  return await supabase
    .from('board_listings')
    .select('*')
    .eq('id', listingId)
    .single()
}

export const createListing = async (listing) => {
  return await supabase
    .from('board_listings')
    .insert(listing)
    .select()
    .single()
}

export const updateListing = async (listingId, updates) => {
  return await supabase
    .from('board_listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', listingId)
    .select()
    .single()
}

export const deleteListing = async (listingId) => {
  return await supabase
    .from('board_listings')
    .delete()
    .eq('id', listingId)
}

export const markListingAsSold = async (listingId) => {
  return await supabase
    .from('board_listings')
    .update({ status: 'sold', updated_at: new Date().toISOString() })
    .eq('id', listingId)
}

export const expressInterest = async (listingId, userId, username, message) => {
  return await supabase
    .from('board_interests')
    .insert({
      listing_id: listingId,
      user_id: userId,
      username,
      message: message || null
    })
    .select()
    .single()
}

export const getInterestsForListing = async (listingId) => {
  return await supabase
    .from('board_interests')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
}

export const getMyInterests = async (userId) => {
  return await supabase
    .from('board_interests')
    .select('*, board_listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const removeInterest = async (listingId, userId) => {
  return await supabase
    .from('board_interests')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', userId)
}

// ============ LEADERBOARD FUNCTIONS ============

export const getCrewLeaderboard = async (crewId, period = 'all') => {
  return await supabase.rpc('get_crew_leaderboard', {
    p_crew_id: crewId,
    p_period: period
  })
}

export const getLeaderboardBadges = async (crewId) => {
  return await supabase
    .from('leaderboard_badges')
    .select('*')
    .eq('crew_id', crewId)
}

export const getUserBadges = async (userId) => {
  return await supabase
    .from('leaderboard_badges')
    .select('*, crews(name)')
    .eq('user_id', userId)
}

// ============ SPOT REVIEWS FUNCTIONS ============

export const getSpotReviews = async (spotName) => {
  return await supabase
    .from('spot_reviews')
    .select('*')
    .eq('spot_name', spotName)
    .order('created_at', { ascending: false })
}

export const getSpotStats = async (spotName) => {
  const { data } = await supabase
    .from('spot_reviews')
    .select('rating, skill_level, crowds, parking, best_tide, best_swell')
    .eq('spot_name', spotName)
  
  if (!data || data.length === 0) return null
  
  // Calculate averages and most common values
  const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length
  
  const mode = (arr) => {
    const counts = {}
    arr.filter(Boolean).forEach(v => counts[v] = (counts[v] || 0) + 1)
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  }
  
  return {
    avgRating: Math.round(avgRating * 10) / 10,
    totalReviews: data.length,
    skillLevel: mode(data.map(r => r.skill_level)),
    crowds: mode(data.map(r => r.crowds)),
    parking: mode(data.map(r => r.parking)),
    bestTide: mode(data.map(r => r.best_tide)),
    bestSwell: mode(data.map(r => r.best_swell))
  }
}

export const createSpotReview = async (review) => {
  return await supabase
    .from('spot_reviews')
    .upsert(review, { onConflict: 'spot_name,user_id' })
    .select()
    .single()
}

export const deleteSpotReview = async (reviewId) => {
  return await supabase
    .from('spot_reviews')
    .delete()
    .eq('id', reviewId)
}

// ============ SESSIONS LOG FUNCTIONS ============

export const getUserSessions = async (userId, limit = 10, offset = 0) => {
  return await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .range(offset, offset + limit - 1)
}

export const getSpotSessions = async (spotName, limit = 10) => {
  return await supabase
    .from('sessions')
    .select('*')
    .eq('spot_name', spotName)
    .order('session_date', { ascending: false })
    .limit(limit)
}

export const createSession = async (session) => {
  return await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single()
}

export const updateSession = async (sessionId, updates) => {
  return await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()
}

export const deleteSession = async (sessionId) => {
  return await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
}

export const linkSessionToSignal = async (sessionId, signalId) => {
  return await supabase
    .from('sessions')
    .update({ signal_id: signalId })
    .eq('id', sessionId)
}

// ============ CONDITION ALERTS FUNCTIONS ============

export const getUserAlerts = async (userId) => {
  return await supabase
    .from('condition_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export const getActiveAlerts = async (userId) => {
  return await supabase
    .from('condition_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
}

export const createAlert = async (alert) => {
  return await supabase
    .from('condition_alerts')
    .insert(alert)
    .select()
    .single()
}

export const updateAlert = async (alertId, updates) => {
  return await supabase
    .from('condition_alerts')
    .update(updates)
    .eq('id', alertId)
    .select()
    .single()
}

export const deleteAlert = async (alertId) => {
  return await supabase
    .from('condition_alerts')
    .delete()
    .eq('id', alertId)
}

export const toggleAlert = async (alertId, isActive) => {
  return await supabase
    .from('condition_alerts')
    .update({ is_active: isActive })
    .eq('id', alertId)
}

export const markAlertTriggered = async (alertId) => {
  return await supabase
    .from('condition_alerts')
    .update({ last_triggered: new Date().toISOString() })
    .eq('id', alertId)
}

// ============ CREW INVITES FUNCTIONS ============

// Get crew invite code
export const getCrewInviteCode = async (crewId) => {
  return await supabase
    .from('crews')
    .select('invite_code, is_public')
    .eq('id', crewId)
    .single()
}

// Regenerate invite code
export const regenerateInviteCode = async (crewId) => {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  return await supabase
    .from('crews')
    .update({ invite_code: newCode })
    .eq('id', crewId)
    .select('invite_code')
    .single()
}

// Toggle crew public/private
export const toggleCrewPublic = async (crewId, isPublic) => {
  return await supabase
    .from('crews')
    .update({ is_public: isPublic })
    .eq('id', crewId)
}

// Join crew by invite code
export const joinCrewByCode = async (inviteCode, userId, username) => {
  return await supabase.rpc('join_crew_by_code', {
    p_invite_code: inviteCode.toUpperCase(),
    p_user_id: userId,
    p_username: username
  })
}

// Search users to invite
export const searchUsers = async (query) => {
  return await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(10)
}

// Send invite to user
export const sendCrewInvite = async (crewId, invitedUserId, invitedBy) => {
  return await supabase
    .from('crew_invites')
    .insert({
      crew_id: crewId,
      invited_user_id: invitedUserId,
      invited_by: invitedBy
    })
    .select()
    .single()
}

// Get pending invites for user
export const getPendingInvites = async (userId) => {
  const { data, error } = await supabase
    .from('crew_invites')
    .select(`
      *,
      crews:crew_id (id, name, sport)
    `)
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error fetching invites:', error)
    return { data: [], error }
  }
  
  // Get inviter usernames separately
  if (data && data.length > 0) {
    const inviterIds = [...new Set(data.map(d => d.invited_by))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', inviterIds)
    
    const profileMap = {}
    profiles?.forEach(p => profileMap[p.id] = p.username)
    
    data.forEach(invite => {
      invite.inviter_username = profileMap[invite.invited_by] || 'Unknown'
    })
  }
  
  return { data, error: null }
}

// Accept invite
export const acceptInvite = async (inviteId, crewId, userId, username) => {
  // Update invite status
  await supabase
    .from('crew_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId)
  
  // Add to crew (status 'active' to match getMyCrews filter)
  return await supabase
    .from('crew_members')
    .insert({
      crew_id: crewId,
      user_id: userId,
      role: 'member',
      status: 'active'
    })
}

// Decline invite
export const declineInvite = async (inviteId) => {
  return await supabase
    .from('crew_invites')
    .update({ status: 'declined' })
    .eq('id', inviteId)
}

// Get public crews
export const getPublicCrews = async () => {
  return await supabase
    .from('crews')
    .select(`
      *,
      crew_members (user_id)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
}

// Check if user is crew admin
export const isCrewAdmin = async (crewId, userId) => {
  const { data } = await supabase
    .from('crew_members')
    .select('role')
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .single()
  
  return data?.role === 'admin'
}

// ============ FOLLOWS ============

// Request to follow someone
export const requestFollow = async (followingId) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  
  return await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
      status: 'pending'
    })
}

// Cancel follow request or unfollow
export const unfollow = async (followingId) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  
  return await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
}

// Accept follow request
export const acceptFollowRequest = async (followerId) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  
  return await supabase
    .from('follows')
    .update({ status: 'accepted' })
    .eq('follower_id', followerId)
    .eq('following_id', user.id)
}

// Decline follow request
export const declineFollowRequest = async (followerId) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  
  return await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', user.id)
}

// Get pending follow requests (people wanting to follow me)
export const getPendingFollowRequests = async () => {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }
  
  const { data, error } = await supabase
    .from('follows')
    .select('id, follower_id, created_at')
    .eq('following_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  
  if (error || !data || data.length === 0) return { data: [], error }
  
  // Get profiles
  const followerIds = data.map(f => f.follower_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', followerIds)
  
  const profileMap = {}
  profiles?.forEach(p => profileMap[p.id] = p)
  
  const result = data.map(f => ({
    ...f,
    profile: profileMap[f.follower_id]
  }))
  
  return { data: result, error: null }
}

// Get my followers (accepted)
export const getFollowers = async (userId) => {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, created_at')
    .eq('following_id', userId)
    .eq('status', 'accepted')
  
  if (error || !data || data.length === 0) return { data: [], error }
  
  const followerIds = data.map(f => f.follower_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', followerIds)
  
  return { data: profiles || [], error: null }
}

// Get who I'm following (accepted)
export const getFollowing = async (userId) => {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, created_at')
    .eq('follower_id', userId)
    .eq('status', 'accepted')
  
  if (error || !data || data.length === 0) return { data: [], error }
  
  const followingIds = data.map(f => f.following_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', followingIds)
  
  return { data: profiles || [], error: null }
}

// Get follow status between me and another user
export const getFollowStatus = async (targetUserId) => {
  const user = await getCurrentUser()
  if (!user) return { iFollow: null, theyFollowMe: null }
  
  // Check if I follow them
  const { data: iFollowData } = await supabase
    .from('follows')
    .select('status')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single()
  
  // Check if they follow me
  const { data: theyFollowData } = await supabase
    .from('follows')
    .select('status')
    .eq('follower_id', targetUserId)
    .eq('following_id', user.id)
    .single()
  
  return {
    iFollow: iFollowData?.status || null,
    theyFollowMe: theyFollowData?.status || null
  }
}

// Get IDs of users I follow (for feed filtering)
export const getFollowingIds = async () => {
  const user = await getCurrentUser()
  if (!user) return []
  
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)
    .eq('status', 'accepted')
  
  return data?.map(f => f.following_id) || []
}

// Get follower/following counts
export const getFollowCounts = async (userId) => {
  const { count: followers } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
    .eq('status', 'accepted')
  
  const { count: following } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
    .eq('status', 'accepted')
  
  return { followers: followers || 0, following: following || 0 }
}

// Get signals feed filtered by follows
export const getFollowingSignalsFeed = async (crewIds, limit = 20, offset = 0) => {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }

  // Get IDs of users I follow
  const followingIds = await getFollowingIds()

  // Include myself in the feed
  const userIdsToShow = [...followingIds, user.id]

  // Get signals from my crews AND from users I follow
  let query = supabase
    .from('signals')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  // Filter by crew OR by followed users
  if (crewIds.length > 0 && followingIds.length > 0) {
    query = query.or(`crew_id.in.(${crewIds.join(',')}),user_id.in.(${userIdsToShow.join(',')})`)
  } else if (crewIds.length > 0) {
    query = query.in('crew_id', crewIds)
  } else if (userIdsToShow.length > 0) {
    query = query.in('user_id', userIdsToShow)
  } else {
    return { data: [], error: null }
  }
  
  const { data: signalsData, error: signalsError } = await query
  
  if (signalsError || !signalsData) return { data: [], error: signalsError }
  
  // Get user profiles
  const userIds = [...new Set(signalsData.map(s => s.user_id))]
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)
  
  // Get crew info
  const crewIdsFromSignals = [...new Set(signalsData.map(s => s.crew_id).filter(Boolean))]
  let crewsData = []
  if (crewIdsFromSignals.length > 0) {
    const { data } = await supabase
      .from('crews')
      .select('id, name, sport')
      .in('id', crewIdsFromSignals)
    crewsData = data || []
  }
  
  // Merge data
  const signals = signalsData.map(s => ({
    ...s,
    username: profilesData?.find(p => p.id === s.user_id)?.username || 'Unknown',
    crew_name: crewsData?.find(c => c.id === s.crew_id)?.name || 'Unknown',
    crew_sport: crewsData?.find(c => c.id === s.crew_id)?.sport || 'surf'
  }))
  
  return { data: signals, error: null }
}

// ============ DIRECT MESSAGES ============

// Check if two users share a crew
export const usersShareCrew = async (otherUserId) => {
  const user = await getCurrentUser()
  if (!user) return false
  
  const { data } = await supabase.rpc('users_share_crew', {
    user_a: user.id,
    user_b: otherUserId
  })
  
  return data || false
}

// Get or create conversation
export const getOrCreateConversation = async (otherUserId) => {
  const user = await getCurrentUser()
  if (!user) return { data: null, error: 'Not authenticated' }
  
  // Ensure consistent ordering (smaller UUID first)
  const [user1, user2] = user.id < otherUserId 
    ? [user.id, otherUserId] 
    : [otherUserId, user.id]
  
  // Check if conversation exists
  let { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('user1_id', user1)
    .eq('user2_id', user2)
    .single()
  
  if (existing) return { data: existing, error: null }
  
  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user1_id: user1, user2_id: user2 })
    .select()
    .single()
  
  return { data, error }
}

// Get all conversations for current user
export const getConversations = async () => {
  const user = await getCurrentUser()
  if (!user) return { data: [], error: null }
  
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order('last_message_at', { ascending: false })
  
  if (error || !data) return { data: [], error }
  
  // Get other user profiles and last messages
  const otherUserIds = data.map(c => 
    c.user1_id === user.id ? c.user2_id : c.user1_id
  )
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .in('id', otherUserIds)
  
  // Get last message for each conversation
  const conversationsWithDetails = await Promise.all(data.map(async (conv) => {
    const otherUserId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id
    const otherUser = profiles?.find(p => p.id === otherUserId)
    
    // Get last message
    const { data: lastMsg } = await supabase
      .from('direct_messages')
      .select('content, sender_id, created_at')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Get unread count
    const { count } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
      .is('read_at', null)
    
    return {
      ...conv,
      other_user: otherUser,
      last_message: lastMsg,
      unread_count: count || 0
    }
  }))
  
  return { data: conversationsWithDetails, error: null }
}

// Get messages for a conversation
export const getMessages = async (conversationId, limit = 50) => {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit)
  
  return { data: data || [], error }
}

// Send a message
export const sendDirectMessage = async (conversationId, content) => {
  const user = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }
  
  // Insert message
  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content
    })
    .select()
    .single()
  
  if (error) return { data: null, error }
  
  // Update conversation last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
  
  return { data, error: null }
}

// Mark messages as read
export const markMessagesAsRead = async (conversationId) => {
  const user = await getCurrentUser()
  if (!user) return
  
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}

// Get total unread count
export const getUnreadCount = async () => {
  const user = await getCurrentUser()
  if (!user) return 0
  
  // Get user's conversations
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
  
  if (!convs || convs.length === 0) return 0
  
  const convIds = convs.map(c => c.id)
  
  const { count } = await supabase
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .neq('sender_id', user.id)
    .is('read_at', null)
  
  return count || 0
}
