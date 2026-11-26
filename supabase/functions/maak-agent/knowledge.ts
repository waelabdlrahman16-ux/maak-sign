// Maak knowledge pack. Only facts with a source. level "official" = the provider's own page;
// level "news" = a news report — the agent must present it as "usually" and ask staff to confirm.
// Checked 24 Nov 2026. Social Solidarity facts: Ministry of Social Solidarity FAQ (official).
// 25 Nov 2026: National Bank of Egypt official card fees (cards tariff PDF) and hotline; civil registry official facts from Digital Egypt and the Civil Status Sector site; hospital facts (123 news level; Wasel app official, MCIT).

export type Fact = { text: string; level: "official" | "news"; source: string };

export const KNOWLEDGE: Record<string, { name: string; facts: Fact[] }> = {
  bank_misr: {
    name: "بنك مصر",
    facts: [
      { text: "Replacing a lost or damaged debit card costs 100 EGP.", level: "official", source: "https://www.banquemisr.com/en/Home/SMEs/Retail-Banking/Pages/Cards/Debit-Cards-Pages/VISA-and-MasterCard-Debit-Cards" },
      { text: "Issuing a new debit card costs 150 EGP.", level: "official", source: "https://www.banquemisr.com/en/Home/SMEs/Retail-Banking/Pages/Cards/Debit-Cards-Pages/VISA-and-MasterCard-Debit-Cards" },
      { text: "Setting or resetting a card PIN costs 15 EGP.", level: "official", source: "https://www.banquemisr.com/en/Home/SMEs/Retail-Banking/Pages/Cards/Debit-Cards-Pages/VISA-and-MasterCard-Debit-Cards" },
      { text: "Stopping a lost or stolen card is done through the call center 19888, open day and night (a voice call), so a deaf customer should ask the branch staff to stop it.", level: "official", source: "https://www.banquemisr.com/en/Home/CONTACT-US/Call-Center" },
      { text: "The 19888 call center also creates a PIN and cancels wrong-PIN attempts.", level: "official", source: "https://www.banquemisr.com/en/Home/CONTACT-US/Call-Center" },
      { text: "The BM Online app can pause a card temporarily, set a PIN, unblock a PIN after wrong attempts, and request a new card.", level: "official", source: "https://www.banquemisr.com/ar-EG/Home/Pages/BM-Online---Internet-and-Mobile-banking" },
    ],
  },
  nbe: {
    name: "البنك الأهلي المصري",
    facts: [
      { text: "Replacing a lost or damaged Meeza debit card costs 75 EGP.", level: "official", source: "https://www.nbe.com.eg/AssetsManager/392308a7-962c-4905-ad02-c0f07ed1eadf.pdf" },
      { text: "Replacing a lost or damaged Classic Visa or Mastercard debit card costs 150 EGP.", level: "official", source: "https://www.nbe.com.eg/AssetsManager/392308a7-962c-4905-ad02-c0f07ed1eadf.pdf" },
      { text: "Issuing a Meeza debit card costs 75 EGP; issuing a Classic Visa or Mastercard debit card costs 125 EGP.", level: "official", source: "https://www.nbe.com.eg/AssetsManager/392308a7-962c-4905-ad02-c0f07ed1eadf.pdf" },
      { text: "A lost card or any card problem is reported to the 24-hour hotline 19623 (a voice call), so a deaf customer should ask the branch staff to stop the card.", level: "official", source: "https://www.nbe.com.eg/NBE/E/#/AR/ProductCategory?inParams=%7B%22CategoryID%22%3A%22Tariff%22%7D" },
    ],
  },
  civil_registry: {
    name: "السجل المدني",
    facts: [
      { text: "For a lost national ID card, first file a police report at the nearest police station.", level: "news", source: "https://www.masrawy.com/news/news_cases/details/2026/2/25/2948349" },
      { text: "At the civil registry office bring a recent personal photo and a copy of the police report.", level: "news", source: "https://www.masrawy.com/news/news_cases/details/2026/2/25/2948349" },
      { text: "The office tells you the fee after you submit the papers, and you pay it at the same office.", level: "news", source: "https://www.masrawy.com/news/news_cases/details/2026/2/25/2948349" },
      { text: "A replacement can also be requested on the Digital Egypt portal and is delivered to your address within a few days.", level: "news", source: "https://www.masrawy.com/news/news_cases/details/2026/2/25/2948349" },
      { text: "The Digital Egypt portal (digital.gov.eg) has an official service to replace a lost national ID card from home and deliver it to your address; you sign in to the portal, and the service page lists no papers to upload.", level: "official", source: "https://digital.gov.eg/categories/terms/%D8%A8%D8%AF%D9%84-%D9%81%D8%A7%D9%82%D8%AF-%D8%A8%D8%B7%D8%A7%D9%82%D8%A9-%D8%A7%D9%84%D8%B1%D9%82%D9%85-%D8%A7%D9%84%D9%82%D9%88%D9%85%D9%8A" },
      { text: "The Civil Status Sector call center numbers are 15340, 15341 and 16582, until 9 PM; line 15341 is for people with disabilities. These are voice calls, so a deaf customer needs someone to call for them.", level: "official", source: "https://cso.moi.gov.eg/" },
    ],
  },
  social_solidarity: {
    name: "الوحدة الاجتماعية (التضامن)",
    facts: [
      { text: "Takaful and Karama applications are made all year round at the nearest social unit that serves your home address.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "Karama is for people aged 65 or older and for persons with a disability rate of 50% or more; Takaful is for families below the poverty line whose children attend school.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "Documents: valid national ID cards of both spouses, the marriage, divorce, death or desertion document, the children's birth certificates and school enrolment, and a computerised family register; for Karama also the medical commission form number or the integrated services card if you have one.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "A lost Takaful or Karama card is replaced through the hotline 19680 or 19681 (a voice call), so a deaf person should ask the social unit staff to do it; a fee of 25 EGP may apply.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "The integrated services card is for all persons with disabilities, including hearing disabilities. You register on the Ministry of Health portal pod.mohp.gov.eg to book a medical committee exam, and the card is issued about 45 to 60 days after the local rehabilitation office finishes.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "Assistive devices such as hearing aids and cochlear implant repair are free, for any age, and do not need the integrated services card.", level: "official", source: "https://www.moss.gov.eg/%D8%A7%D9%84%D8%A7%D8%B3%D8%A6%D9%84%D8%A9-%D8%A7%D9%84%D8%B4%D8%A7%D8%A6%D8%B9%D8%A9/" },
      { text: "After a Takaful and Karama application, a social researcher visits the home to check eligibility.", level: "news", source: "https://www.masrawy.com/news/news_egypt/details/2026/11/8/3075284" },
    ],
  },
  hospital: {
    name: "المستشفى",
    facts: [
      { text: "In an emergency, 123 calls an ambulance to the nearest Ministry of Health hospital. It is a voice call, so a deaf person needs someone nearby to call.", level: "news", source: "https://help.unhcr.org/egypt/en/health-services/health-2/" },
      { text: "Public hospitals give basic life-saving emergency care free or at low cost; advanced treatment or a stay longer than 24 hours is paid.", level: "news", source: "https://help.unhcr.org/egypt/en/health-services/health-2/" },
      { text: "The Ministry of Communications' Technical Center for Services of Persons with Disabilities runs the Wasel app (واصل), a relay call centre that lets deaf and hard-of-hearing people reach emergency services such as ambulance, police and fire, around the clock (announced April 2020; check it still works before relying on it).", level: "official", source: "https://mcit.gov.eg/Ar/Media_Center/Press_Room/Press_Releases/45681" },
    ],
  },
};

export const ICONS = [
  "credit_card", "credit_card_off", "block", "payments", "event", "schedule", "badge", "description",
  "local_police", "photo_camera", "call", "location_on", "receipt_long", "medication", "local_hospital",
  "account_balance", "family_restroom", "task_alt", "help", "edit_document", "person", "home", "school",
  "password", "inventory_2", "warning", "storefront", "hourglass_top", "cancel", "check_circle",
];
