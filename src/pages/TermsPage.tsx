import LegalDocument from '../components/legal/LegalDocument'
import { TERMS_OF_SERVICE } from '../data/legal'

export default function TermsPage() {
  return <LegalDocument document={TERMS_OF_SERVICE} />
}
