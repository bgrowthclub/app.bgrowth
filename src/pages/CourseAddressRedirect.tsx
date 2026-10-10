import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// The old address of the "Inglês de Mudança" course. vercel.json redirects
// it on the server; this catches anything that still reaches the site
// (e.g. a cached page) and sends it to the course's current address, which
// is a separate app — hence a full page load, not a router navigation.
export const COURSE_PATH = '/p/bruno/ingles-de-mudanca'

export default function CourseAddressRedirect() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    const rest = pathname.replace(/^\/ingles-de-mudanca/, '')
    window.location.replace(`${COURSE_PATH}${rest}${search}`)
  }, [pathname, search])
  return null
}
