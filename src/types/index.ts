export type MediaType = 'movie' | 'tv'

export type WatchStatus = 'want_to_watch' | 'watching' | 'watched'

export type GroupItemStatus = 'suggested' | 'watching' | 'watched'

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface WatchlistItem {
  id: string
  user_id: string
  tmdb_id: number
  media_type: MediaType
  title: string
  poster_path: string | null
  status: WatchStatus
  rating: number | null
  notes: string | null
  added_at: string
  watched_at: string | null
}

export interface WatchGroup {
  id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
  member_count?: number
}

export interface WatchGroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface WatchGroupItem {
  id: string
  group_id: string
  tmdb_id: number
  media_type: MediaType
  title: string
  poster_path: string | null
  suggested_by: string | null
  status: GroupItemStatus
  created_at: string
  suggester?: Profile
}

export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date: string
  vote_average: number
  media_type: 'movie'
  genre_ids: number[]
}

export interface TMDBTVShow {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  first_air_date: string
  vote_average: number
  media_type: 'tv'
  genre_ids: number[]
}

export type TMDBResult = TMDBMovie | TMDBTVShow

export interface TMDBSearchResponse {
  page: number
  results: TMDBResult[]
  total_pages: number
  total_results: number
}
