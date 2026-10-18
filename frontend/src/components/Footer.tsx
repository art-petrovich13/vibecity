import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './Logo';

export const Footer = () => {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-ink-950/60">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/45">
            Афиша событий Беларуси: концерты, театр, выставки, стендап и спорт. Собираем то, что
            стоит вашего вечера — от Минска до Гомеля и Бреста.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Сервис</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/55">
            <li>
              <Link to="/" className="transition hover:text-white">
                Афиша
              </Link>
            </li>
            <li>
              <Link to="/profile" className="transition hover:text-white">
                Мои билеты
              </Link>
            </li>
            <li>
              <Link to="/organizer" className="transition hover:text-white">
                Разместить мероприятие
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Города</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/55">
            <li>Минск · Гомель</li>
            <li>Брест · Витебск</li>
            <li>Гродно · Могилёв</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Контакты</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-white/55">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-vibe-300" /> hello@vibecity.by
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-vibe-300" /> +375 29 000-00-00
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-vibe-300" /> Минск, ул. Октябрьская, 16
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="page-container flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/30 sm:flex-row">
          <span>© {new Date().getFullYear()} VibeCity. Учебный проект.</span>
          <span>Сделано с любовью к городу и хорошей музыке.</span>
        </div>
      </div>
    </footer>
  );
};
