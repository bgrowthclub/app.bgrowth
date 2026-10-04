import LegalDocument from '../components/legal/LegalDocument'
import { PRIVACY_POLICY } from '../data/legal'

export default function PrivacyPage() {
  return <LegalDocument document={PRIVACY_POLICY} />
}
