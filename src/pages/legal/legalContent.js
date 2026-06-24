// Generic legal templates (FR/EN). Replace the [bracketed] placeholders with
// your real details before going to production — this is a starting point, not
// legal advice.
const COMPANY = 'MarketMax'
const CONTACT = '[ton-email@exemple.com]'
const UPDATED = '2026-06-24'

export const LEGAL = {
  cgu: {
    fr: {
      title: "Conditions Générales d'Utilisation",
      updated: UPDATED,
      sections: [
        ['1. Objet', `Les présentes CGU régissent l'utilisation de ${COMPANY}, un outil d'aide à la recherche de niches produits Amazon. En utilisant le service, vous acceptez ces conditions.`],
        ['2. Service', `${COMPANY} fournit des estimations et des données agrégées (tendances, best-sellers, mots-clés) à but informatif et éducatif. Les chiffres sont des estimations et ne constituent pas un conseil commercial ou financier.`],
        ['3. Compte', `La création d'un compte requiert une adresse email valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité sur votre compte.`],
        ['4. Utilisation acceptable', `Vous vous engagez à ne pas détourner le service, à respecter les conditions d'utilisation d'Amazon, Reddit, Google et des autres sources, et à ne pas effectuer de collecte massive de données.`],
        ['5. Responsabilité', `Le service est fourni « en l'état », sans garantie. ${COMPANY} ne saurait être tenu responsable des décisions prises sur la base des estimations fournies.`],
        ['6. Contact', `Pour toute question : ${CONTACT}.`],
      ],
    },
    en: {
      title: 'Terms of Service',
      updated: UPDATED,
      sections: [
        ['1. Purpose', `These Terms govern the use of ${COMPANY}, a tool to help research Amazon product niches. By using the service you accept these terms.`],
        ['2. Service', `${COMPANY} provides estimates and aggregated data (trends, best sellers, keywords) for informational and educational purposes. Figures are estimates and are not business or financial advice.`],
        ['3. Account', `Creating an account requires a valid email address. You are responsible for keeping your credentials confidential and for any activity on your account.`],
        ['4. Acceptable use', `You agree not to misuse the service, to respect the terms of Amazon, Reddit, Google and other sources, and not to perform mass data scraping.`],
        ['5. Liability', `The service is provided "as is", without warranty. ${COMPANY} is not liable for decisions made based on the estimates provided.`],
        ['6. Contact', `Any questions: ${CONTACT}.`],
      ],
    },
  },
  confidentialite: {
    fr: {
      title: 'Politique de confidentialité (RGPD)',
      updated: UPDATED,
      sections: [
        ['1. Données collectées', `Nous collectons : votre email et mot de passe (haché), votre nom et avatar facultatifs, vos listes/niches sauvegardées, et un journal d'activité (connexions, modifications) incluant l'adresse IP.`],
        ['2. Finalités', `Ces données servent uniquement à fournir le service : authentification, synchronisation entre appareils, et sécurité (journal d'audit).`],
        ['3. Base légale & hébergement', `Le traitement repose sur l'exécution du service et votre consentement. Les données sont hébergées chez Supabase. Aucune donnée n'est vendue à des tiers.`],
        ['4. Vos droits', `Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression. Vous pouvez supprimer votre compte et toutes vos données depuis la page Profil → Zone de danger.`],
        ['5. Conservation', `Vos données sont conservées tant que votre compte est actif. La suppression du compte efface vos données associées.`],
        ['6. Contact', `Délégué à la protection des données : ${CONTACT}.`],
      ],
    },
    en: {
      title: 'Privacy Policy (GDPR)',
      updated: UPDATED,
      sections: [
        ['1. Data collected', `We collect: your email and password (hashed), optional name and avatar, your saved lists/niches, and an activity log (logins, changes) including IP address.`],
        ['2. Purpose', `This data is used only to provide the service: authentication, cross-device sync, and security (audit log).`],
        ['3. Legal basis & hosting', `Processing is based on performing the service and your consent. Data is hosted on Supabase. No data is sold to third parties.`],
        ['4. Your rights', `Under GDPR you have the right to access, rectify, port and erase your data. You can delete your account and all data from Profile → Danger zone.`],
        ['5. Retention', `Your data is kept while your account is active. Deleting the account erases your associated data.`],
        ['6. Contact', `Data protection contact: ${CONTACT}.`],
      ],
    },
  },
  cookies: {
    fr: {
      title: 'Gestion des cookies',
      updated: UPDATED,
      sections: [
        ['1. Cookies & stockage local', `${COMPANY} n'utilise pas de cookies publicitaires ni de traceurs tiers. Nous utilisons le stockage local (localStorage) du navigateur pour des fonctions essentielles.`],
        ['2. Ce que nous stockons', `Votre préférence de langue, votre choix de consentement, votre session de connexion, et en mode invité vos listes/tableau. Ces données restent sur votre appareil.`],
        ['3. Gérer', `Vous pouvez effacer ces données à tout moment en vidant le stockage local de votre navigateur. Le refus du consentement ne bloque pas les fonctions essentielles.`],
        ['4. Contact', CONTACT],
      ],
    },
    en: {
      title: 'Cookie management',
      updated: UPDATED,
      sections: [
        ['1. Cookies & local storage', `${COMPANY} does not use advertising cookies or third-party trackers. We use the browser's localStorage for essential functionality.`],
        ['2. What we store', `Your language preference, consent choice, login session, and in guest mode your lists/board. This stays on your device.`],
        ['3. Manage', `You can clear this anytime by clearing your browser's local storage. Declining consent does not block essential functions.`],
        ['4. Contact', CONTACT],
      ],
    },
  },
}
