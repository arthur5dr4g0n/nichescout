// Plain-English glossary used by the (i) tooltips across the app.
export const METRICS = {
  asin: 'ASIN — Amazon Standard Identification Number. The unique 10-character ID Amazon gives every product.',
  price: 'The current listed selling price of the product.',
  bsr: 'BSR — Best Sellers Rank. How well a product sells inside its category. #1 = the best seller. Lower number = more sales.',
  sales:
    'Estimated units sold per month. Calculated from the BSR using a category sales curve (an estimate, not exact Amazon data).',
  revenue: 'Estimated gross revenue per month = estimated monthly sales × price (before fees).',
  reviews: 'Total number of customer reviews. Lots of reviews = an established, harder-to-beat competitor.',
  rating: 'Average star rating out of 5. A low rating with high sales can be an opportunity to make a better product.',
  sellers: 'How many sellers offer this exact product. More sellers = more price competition on the same listing.',
  fba:
    'FBA fee — what Amazon charges to store, pack and ship one unit (Fulfilled By Amazon), plus the ~15% referral fee. Subtract it from price to gauge margin.',
  niche:
    'Niche Score (0–100) — our quick read on how attractive this set of products is to enter. Higher = easier + more profitable. Blends competition (reviews), profitability (revenue) and price sweet-spot.',
  volume: 'Search Volume — roughly how many times per month people type this keyword into search.',
  competition: 'Competition — how many advertisers/sellers fight over this keyword. Low = easier to rank/advertise.',
  cpc: 'CPC — Cost Per Click. The estimated price advertisers pay for one click on this keyword. High CPC = buyers with money.',
  trend: 'Trend — whether interest in this keyword is rising or falling over recent months.',
}
