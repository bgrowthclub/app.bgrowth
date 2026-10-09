// The site's legal pages — Privacy Policy, Terms of Service and Refund
// Policy — as data, rendered by components/legal/LegalDocument.tsx. Facts
// come from the business owner (seller name, 7-day refund window, contact
// e-mail) and from how the site actually works (Supabase accounts, Stripe
// payments, Vercel hosting). Change a policy here, not in a page.

export const LEGAL_COMPANY = 'BGrowth'
export const LEGAL_SITE = 'bgrowth.app'
export const LEGAL_EMAIL = 'info@bgrowth.app'
export const LEGAL_UPDATED = 'October 3, 2026'
export const LEGAL_JURISDICTION = 'California, United States'
export const REFUND_WINDOW_DAYS = 7

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface LegalDocumentData {
  slug: 'privacy' | 'terms' | 'refund-policy'
  title: string
  summary: string
  sections: LegalSection[]
}

export const PRIVACY_POLICY: LegalDocumentData = {
  slug: 'privacy',
  title: 'Privacy Policy',
  summary: `How ${LEGAL_COMPANY} collects, uses and protects your information when you use ${LEGAL_SITE}.`,
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        `${LEGAL_COMPANY} ("we", "us") operates ${LEGAL_SITE} and the BGrowth Workspaces sold on it. If you have any question about this policy or your data, write to ${LEGAL_EMAIL}.`,
      ],
    },
    {
      heading: 'Information we collect',
      bullets: [
        'Account information: your name, e-mail address and password. Passwords are stored by our authentication provider in hashed form — we never see them.',
        'Purchase information: what you bought, when, and the amount. Card details are entered on Stripe’s secure checkout and are never stored on our servers.',
        'Workspace content: the information you type into a Workspace and save as a record, so it is there the next time you sign in.',
        'Technical information: basic logs such as IP address, browser type and the pages requested, used to keep the service secure and working.',
        'Messages you send us, for example when you contact support.',
      ],
    },
    {
      heading: 'How we use your information',
      bullets: [
        'To create and secure your account and let you sign in.',
        'To process purchases, free trials and refunds, and give you access to what you bought.',
        'To save and show your Workspace records.',
        'To send service e-mails such as account confirmation, password reset and purchase receipts.',
        'To answer your questions and provide support.',
        'To prevent fraud and abuse, and to meet legal and tax obligations.',
      ],
      paragraphs: ['We do not sell your personal information, and we do not use it for third-party advertising.'],
    },
    {
      heading: 'Service providers',
      paragraphs: [
        'We share information only with the providers that run parts of the service for us, and only what they need:',
      ],
      bullets: [
        'Supabase — accounts, sign-in and the database that stores your purchases and Workspace records.',
        'Stripe — payment processing.',
        'Vercel — hosting of the website.',
        'E-mail providers — delivery of service e-mails and support messages.',
      ],
    },
    {
      heading: 'Cookies and local storage',
      paragraphs: [
        'We use your browser’s local storage to keep you signed in and to remember simple preferences. We do not use advertising cookies. Stripe may use its own cookies on its checkout page to prevent fraud.',
      ],
    },
    {
      heading: 'How long we keep information',
      paragraphs: [
        'We keep your account and Workspace records while your account is active. Purchase records are kept as long as required for accounting and tax purposes. When you ask us to delete your account, we delete or anonymize your information unless we must keep it by law. If the account already used its free trial, we keep only a one-way fingerprint of the e-mail address (it can’t be turned back into the address), so a new account with the same e-mail doesn’t get a second free trial.',
      ],
    },
    {
      heading: 'Your choices and rights',
      paragraphs: [
        `You can update your name in your account settings. You can ask us to access, correct, export or delete your personal information, or to close your account, by writing to ${LEGAL_EMAIL}. You can also ask to delete your account and its data yourself, in Settings → Delete account. We will answer within 30 days.`,
        'California residents may also ask what personal information we collected about them in the last 12 months and ask us to delete it. We do not sell or share personal information for advertising, and we will not treat you differently for using these rights.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'Data is sent over encrypted connections (HTTPS), and access to your records is restricted to your own account. No system is perfectly secure, so please use a strong password and keep it private.',
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        `${LEGAL_SITE} is not intended for children under 13, and we do not knowingly collect information from them. If you believe a child has created an account, contact us and we will delete it.`,
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'If we change this policy, we will update the date at the top of this page. If the change is significant, we will also let you know by e-mail or on the site.',
      ],
    },
  ],
}

export const TERMS_OF_SERVICE: LegalDocumentData = {
  slug: 'terms',
  title: 'Terms of Service',
  summary: `The rules for using ${LEGAL_SITE} and the BGrowth Workspaces you get on it.`,
  sections: [
    {
      heading: 'Agreement',
      paragraphs: [
        `By creating an account or using ${LEGAL_SITE}, you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the site. These Terms are between you and ${LEGAL_COMPANY}.`,
      ],
    },
    {
      heading: 'Your account',
      bullets: [
        'Give accurate information and keep it up to date.',
        'Keep your password private. You are responsible for activity on your account.',
        'One person per account. Do not share your sign-in with others.',
        `Tell us at ${LEGAL_EMAIL} if you think your account was used without permission.`,
      ],
    },
    {
      heading: 'Workspaces and your license',
      paragraphs: [
        'When you buy a Workspace, or get one for free or through a trial, you receive a personal, non-exclusive, non-transferable license to use it inside your BGrowth account for your own personal or business needs.',
        'You may not copy, resell, share, redistribute or publish the Workspaces themselves, or use them to create a competing product. The Workspaces, their design and content remain the property of BGrowth.',
      ],
    },
    {
      heading: 'Free trials',
      paragraphs: [
        'Each account can start one free trial. A trial gives temporary access to a Workspace for the period shown on its page and ends automatically — you are never charged when a trial ends. To keep using the Workspace after the trial, you can buy it.',
      ],
    },
    {
      heading: 'Prices and payment',
      paragraphs: [
        'Prices are shown on each product page in U.S. dollars, and purchases are one-time payments unless the page says otherwise. Payments are processed securely by Stripe. We may change prices for future purchases; a change never affects something you already bought.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        `You can ask for a refund within ${REFUND_WINDOW_DAYS} days of a purchase. The details are in our Refund Policy.`,
      ],
    },
    {
      heading: 'Your content',
      paragraphs: [
        'What you type into a Workspace belongs to you. You give us permission to store and display it only so we can provide the service to you. You are responsible for the content you enter and for having the right to use it.',
      ],
    },
    {
      heading: 'Acceptable use',
      bullets: [
        'Do not use the site for anything illegal, harmful or fraudulent.',
        'Do not try to access other people’s accounts or data, or to break or overload the service.',
        'Do not copy the site or its content with automated tools.',
      ],
      paragraphs: ['We may suspend or close an account that breaks these Terms.'],
    },
    {
      heading: 'Availability and changes',
      paragraphs: [
        'We work to keep the site available and your records safe, but the service may sometimes be interrupted for maintenance or reasons outside our control. We may improve or change features over time.',
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        'Workspaces are tools to help you organize and plan. They are not legal, tax, financial or professional advice, and results depend on how you use them. The service is provided "as is" to the extent allowed by law.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        `To the extent allowed by law, ${LEGAL_COMPANY} is not liable for indirect or consequential losses, and our total liability for any claim is limited to the amount you paid us for the product in question.`,
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        'These Terms are governed by the laws of the State of California, United States, without regard to its conflict-of-law rules. Any dispute that cannot be resolved informally will be handled by the state or federal courts located in California, unless the law where you live gives you the right to bring it elsewhere.',
      ],
    },
    {
      heading: 'Closing your account',
      paragraphs: [
        `You can stop using the site at any time and ask us to close your account at ${LEGAL_EMAIL}.`,
      ],
    },
    {
      heading: 'Changes to these Terms',
      paragraphs: [
        'If we change these Terms, we will update the date at the top of this page. If the change is significant, we will also let you know by e-mail or on the site. Continuing to use the site after a change means you accept it.',
      ],
    },
  ],
}

export const REFUND_POLICY: LegalDocumentData = {
  slug: 'refund-policy',
  title: 'Refund Policy',
  summary: `If a Workspace isn’t right for you, you can ask for a refund within ${REFUND_WINDOW_DAYS} days of buying it.`,
  sections: [
    {
      heading: `${REFUND_WINDOW_DAYS}-day refund`,
      paragraphs: [
        `You can request a full refund of any paid Workspace within ${REFUND_WINDOW_DAYS} days of the purchase date.`,
      ],
    },
    {
      heading: 'How to ask for a refund',
      paragraphs: [`E-mail ${LEGAL_EMAIL} from the address you used to buy, and tell us:`],
      bullets: ['which Workspace you want refunded;', 'the purchase date (or the receipt).'],
    },
    {
      heading: 'What happens next',
      bullets: [
        'We confirm your request, usually within 2 business days.',
        'The refund goes back to the card or payment method you used. Your bank may take 5 to 10 business days to show it.',
        'Access to the refunded Workspace ends when the refund is issued.',
      ],
    },
    {
      heading: 'Free Workspaces and trials',
      paragraphs: ['Free Workspaces and free trials are never charged, so there is nothing to refund.'],
    },
    {
      heading: `After ${REFUND_WINDOW_DAYS} days`,
      paragraphs: [
        `Purchases are not refundable after ${REFUND_WINDOW_DAYS} days, except where the law requires otherwise. If something isn’t working, write to us anyway — we’re happy to help.`,
      ],
    },
  ],
}

export const LEGAL_DOCUMENTS = [PRIVACY_POLICY, TERMS_OF_SERVICE, REFUND_POLICY]
