'use client'

import Image from 'next/image'
import { useState } from 'react'
import { tmdbImageUrl } from '@/lib/tmdb'
import { TMDBResult } from '@/types'
import { Plus, Check, Star } from 'lucide-react'

interface MediaCardProps {
  item: TMDBResult
  inWatchlist?: boolean
  onAdd?: (item: TMDBResult) => void
}

export default function MediaCard({ item, inWatchlist, onAdd }: MediaCardProps) {
  const [hovered, setHovered] = useState(false)
  const title = item.media_type === 'movie' ? item.title : item.name
  const year = item.media_type === 'movie'
    ? item.release_date?.slice(0, 4)
    : item.first_air_date?.slice(0, 4)
  const imageUrl = tmdbImageUrl(item.poster_path)
  const rating = Math.round(item.vote_average * 10) / 10

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-gray-900 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="aspect-[2/3] relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600 text-4xl">
            🎬
          </div>
        )}

        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`} />

        {hovered && (
          <div className="absolute inset-0 flex flex-col justify-end p-3 gap-2">
            <p className="text-xs text-gray-300 line-clamp-3">{item.overview}</p>
            {onAdd && (
              <button
                onClick={() => onAdd(item)}
                className={`flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                  inWatchlist
                    ? 'bg-green-600/80 text-white'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'
                }`}
              >
                {inWatchlist ? <><Check size={14} /> Na lista</> : <><Plus size={14} /> Adicionar</>}
              </button>
            )}
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            item.media_type === 'movie' ? 'bg-blue-600/80 text-blue-100' : 'bg-orange-600/80 text-orange-100'
          }`}>
            {item.media_type === 'movie' ? 'Filme' : 'Série'}
          </span>
        </div>

        {rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white">{rating}</span>
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-sm font-medium text-white truncate">{title}</p>
        <p className="text-xs text-gray-500">{year}</p>
      </div>
    </div>
  )
}
