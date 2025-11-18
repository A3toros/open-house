import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { activities } from './activities/activityList'
import ActivityCarousel from '../components/home/ActivityCarousel'

const Home = () => {

  return (
    <main className="min-h-screen px-6 py-10 text-white md:px-12 lg:px-20">
      <div className="mx-auto max-w-6xl space-y-12 rounded-3xl bg-white/5 p-8 shadow-2xl shadow-primary/20 backdrop-blur">
        <motion.header
          className="space-y-4 text-center md:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center">
            <img
              src="/logo.png"
              alt="Mathayomwatsing EP AI"
              className="h-20 w-20 rounded-full border border-white/20 bg-white/5 object-cover"
            />
            <div className="space-y-2 text-center md:text-left">
              <p className="text-sm uppercase tracking-[0.35em] text-sky">EP & AI – Empowering Future Minds</p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
                Showcase of Mathayomwatsing AI usage in the classroom.
              </h1>
            </div>
          </div>
        </motion.header>

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
    </main>
  )
}

export default Home

