import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { activities } from './activities/activityList'
import ActivityCarousel from '../components/home/ActivityCarousel'

const Home = () => {

  return (
    <main className="min-h-screen text-white">
      {/* Banner Section */}
      <div className="relative w-full h-[60vh] min-h-[400px] max-h-[600px]">
        <img
          src="/pics/Banner.png"
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-start justify-center pt-8 md:pt-12">
          <motion.p
            className="text-3xl md:text-5xl font-bold uppercase tracking-[0.1em] text-cyan-400 px-4"
            style={{
              textShadow: `
                -2px -2px 0 white,
                2px -2px 0 white,
                -2px 2px 0 white,
                2px 2px 0 white,
                0 0 10px rgba(255, 255, 255, 0.5)
              `,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            EP & AI – Empowering Future Minds
          </motion.p>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl space-y-12 rounded-3xl bg-white/5 p-8 shadow-2xl shadow-primary/20 backdrop-blur">

        <section className="space-y-8">
          <ActivityCarousel items={activities} />
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-white">All activities</h2>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.4em] text-white/60">
              Scroll or search
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {activities.map((activity, index) => (
              <motion.article
                key={activity.slug}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-primary/60 hover:bg-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.03 }}
              >
                <h3 className="font-display text-xl text-white">{activity.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{activity.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-white/70">
                  <span>React screen ready</span>
                  <div className="flex gap-2">
                    <Link
                      to={`/activity/${activity.slug}`}
                      className="rounded-full border border-primary px-3 py-1 font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      Launch
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-2 text-center text-sm text-white/70">
          <span>Mathayomwatsing EP Open House · 2025</span>
        </footer>
        </div>
      </div>
    </main>
  )
}

export default Home

