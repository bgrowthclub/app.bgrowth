import logo from '../assets/logo.png'

const COLUMNS = [
  {
    title: 'Products',
    links: ['Browse Systems', 'Planners', 'Workflows', 'Toolkits'],
  },
  {
    title: 'Industries',
    links: ['Notary', 'Cleaning', 'Bookkeeping', 'Delivery'],
  },
  {
    title: 'Resources',
    links: ['Guides', 'Templates', 'Calculators', 'Blog'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Contact', 'Press'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Community', 'Status', 'Terms'],
  },
]

export default function Footer() {
  return (
    <footer className="relative border-t border-navy/[0.06] bg-bg-soft">
      <div className="container-px mx-auto max-w-7xl py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <a href="#" className="flex items-center gap-2.5">
              <img src={logo} alt="BGrowth" className="h-8 w-8 object-contain" />
              <span className="font-display text-[17px] font-bold tracking-tight text-navy">
                BGrowth
              </span>
            </a>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-navy/45">
              Business Systems that help service business owners launch, organize, and grow with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-semibold text-navy">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-[13px] text-navy/45 transition-colors hover:text-primary"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-navy/[0.06] pt-8 sm:flex-row">
          <p className="text-[12.5px] text-navy/35">
            © {new Date().getFullYear()} BGrowth. All rights reserved.
          </p>
          <div className="flex gap-6 text-[12.5px] text-navy/35">
            <a href="#" className="hover:text-navy/60">Privacy</a>
            <a href="#" className="hover:text-navy/60">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
