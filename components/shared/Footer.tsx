import Link from 'next/link';
import { APP_NAME, ROUTES } from '@/lib/constants';

const FOOTER_LINKS = {
  Platform: [
    { label: 'Marketplace', href: ROUTES.dashboard },
    { label: 'Find Matches', href: ROUTES.dashboard },
    { label: 'Sessions', href: ROUTES.dashboard },
  ],
  Resources: [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Skill Credits', href: '#' },
    { label: 'Community Guidelines', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Contact', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-neo-ink text-neo-cream pt-24 pb-12 border-t-[4px] border-neo-ink">
      <div className="mx-auto w-full max-w-[1440px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
          
          {/* Brand Col */}
          <div className="md:col-span-5">
            <Link href={ROUTES.home} className="flex items-center gap-3 mb-6 inline-flex">
              <div className="w-12 h-12 flex items-center justify-center bg-neo-purple border-[3px] border-neo-ink rounded-md shadow-[4px_4px_0_#FFF9E9] -rotate-3">
                <span className="text-white font-heading font-black text-2xl">S</span>
              </div>
              <span className="font-heading font-black text-3xl tracking-tighter uppercase text-white">
                {APP_NAME}
              </span>
            </Link>
            <p className="text-neo-cream/80 text-lg max-w-sm font-medium border-l-[3px] border-neo-green pl-4">
              Swap skills. <br/>
              <span className="text-neo-green font-bold">Not cash.</span>
            </p>
          </div>

          {/* Links Cols */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-heading font-black text-neo-yellow text-sm uppercase tracking-widest mb-6">
                  {category}
                </h4>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link 
                        href={link.href} 
                        className="text-neo-cream hover:text-neo-green font-bold transition-colors text-base"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Giant Bottom Statement */}
        <div className="border-t-[4px] border-neo-cream/20 pt-16 pb-12 text-center overflow-hidden">
          <h2 className="font-heading font-black text-white uppercase leading-[0.8] tracking-tighter" style={{ fontSize: 'clamp(48px, 11vw, 150px)' }}>
            TEACH <span className="text-transparent" style={{ WebkitTextStroke: '2px #FFF9E9' }}>SOMETHING.</span><br/>
            LEARN <span className="text-neo-green">SOMETHING.</span>
          </h2>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-[4px] border-neo-cream/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-neo-cream uppercase tracking-widest">
          <p>© {new Date().getFullYear()} {APP_NAME}. Built for college students.</p>
          <p>Made for mind2i PS-18</p>
        </div>
      </div>
    </footer>
  );
}
