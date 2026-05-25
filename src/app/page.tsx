import Link from 'next/link'
import { Film, Star, Users, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-gray-950 via-violet-950/20 to-gray-950">
      <div className="max-w-2xl text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Film size={48} className="text-violet-400" />
          <h1 className="text-5xl font-bold text-white">Minha Watchlist</h1>
        </div>

        <p className="text-xl text-gray-400">
          Organize seus filmes e séries. Descubra o que assistir a seguir. Assista junto com amigos.
        </p>

        <div className="grid grid-cols-2 gap-4 mt-10 text-left">
          {[
            { icon: Film, title: 'Sua lista', desc: 'Organize o que quer ver, está assistindo e já assistiu' },
            { icon: Star, title: 'Avalie e anote', desc: 'Dê estrelas e escreva notas sobre o que assistiu' },
            { icon: Sparkles, title: 'Descubra', desc: 'Sugestões baseadas no que você curte' },
            { icon: Users, title: 'Grupos', desc: 'Monte uma lista com amigos para assistir juntos' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
              <Icon size={20} className="text-violet-400 mb-2" />
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  )
}
