const MEAL_ALIASES = {
  'Chapo': ['chapo','chapati','chaps','chapatti','chapate'],
  'Beans': ['beans','maharagwe','bean'],
  'Beef': ['beef','nyama','nyama fry','stew','nyamafry','nyama choma','mbuzi'],
  'Pilau': ['pilau','pilawo','pilaf'],
  'Samaki': ['samaki','fish','tilapia','dagaa','omena'],
  'Kuku': ['kuku','chicken','chiken','kuku choma'],
  'Chafua': ['chafua','mix','leftovers','leftovers fry','mixture'],
  'Chips': ['chips','chipo','chipsi','fries','french fries','chips masala'],
  'Uji': ['uji','porridge','uji wa','uji mgumu'],
  'Githeri': ['githeri','muthokoi','githere','githeri ya'],
  'Matumbo': ['matumbo','mondo','tripe','matumbo fry'],
  'Ugali': ['ugali','ngima','posho','sadza','ugali ya'],
  'Rice Plain': ['rice plain','plain rice','wali plain','rice','wali'],
  'Rice Special': ['rice special','special rice','wali special'],
  'Rice Matumbo': ['rice matumbo','wali matumbo'],
  'Rice Mayai': ['rice mayai','wali mayai','rice egg','egg rice'],
  'Ugali Nyama': ['ugali nyama','ugali beef','ugali na nyama'],
  'Ugali Matumbo': ['ugali matumbo','ugali na matumbo'],
  'Ugali Nyama Choma': ['ugali nyama choma','ugali choma'],
  'Ugali Beans': ['ugali beans','ugali maharagwe','ugali na beans'],
  'Ugali Sukuma': ['ugali sukuma','ugali na sukuma','ugali sukuma wiki'],
  'Ugali Omena': ['ugali omena','ugali na omena'],
  'Mukimo': ['mukimo','irio','mash'],
  'Eggs': ['eggs','mayai','egg','fried egg','boiled egg','scrambled eggs'],
  'Bamba': ['bamba','bamba chips','crisps'],
  'Mandazi': ['mandazi','maandazi','mandasi','mandai'],
  'Bhajia': ['bhajia','bhaji','bajia','potato bhajia'],
  'Smokies': ['smokies','smokie','sausage','sausages'],
  'Samosa': ['samosa','sambusa','samosa ya'],
  'Smokie Pasua': ['smokie pasua','smokies pasua','smokie split'],
  'Mayai Pasua': ['mayai pasua','egg pasua','pasua egg'],
  'Smocha': ['smocha','smokie chapo','smokie na chapo'],
  'Chapo Beans': ['chapo beans','chapati beans','chapo maharagwe'],
  'Chapo Ndengu': ['chapo ndengu','chapati ndengu','chapo na ndengu'],
  'Rice Beans': ['rice beans','wali maharagwe','wali beans'],
  'Rice Ndengu': ['rice ndengu','wali ndengu'],
  'Waru Karanga': ['waru karanga','potato karanga','waru','viazi karanga','viazi'],
  'Biriani': ['biriani','biryani','biriyani'],
  'Mutura': ['mutura','mutura ya','blood sausage'],
  'Tea': ['tea','chai'],
  'Bread': ['bread','mkate','slice'],
  'Avocado': ['avocado','avocado ya','parachichi'],
  'Mala': ['mala','maziwa mala','fermented milk','lala'],
  'Juice': ['juice','juisi','fresh juice'],
  'Soda': ['soda','sodas','soft drink','fizzy','coke','fanta','sprite'],
  'Water': ['water','maji','bottled water'],
  'Chai': ['chai ya','spiced tea','masala chai','tangawizi']
};

function normalizeMeal(input) {
  if (!input) return input;
  const lower = input.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(MEAL_ALIASES)) {
    if (canonical.toLowerCase() === lower) return canonical;
    if (aliases.includes(lower)) return canonical;
  }
  // fuzzy match — find closest alias
  let bestMatch = null;
  let bestScore = 0;
  for (const [canonical, aliases] of Object.entries(MEAL_ALIASES)) {
    const allNames = [canonical.toLowerCase(), ...aliases];
    for (const name of allNames) {
      const score = similarity(lower, name);
      if (score > bestScore && score > 0.7) {
        bestScore = score;
        bestMatch = canonical;
      }
    }
  }
  if (bestMatch) return bestMatch;
  // return title-cased original if no match
  return input.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function similarity(a, b) {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;
  if (longerLength === 0) return 1;
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

module.exports = { normalizeMeal, MEAL_ALIASES };