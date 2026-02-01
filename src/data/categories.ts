export type Option = {
  id: string
  label: string
  sublabel?: string
}

export type Category = {
  id: string
  name: string
  icon: string
  type: 'outcome' | 'player' | 'fun' | 'halftime' | 'ads'
  options: Option[]
}

export const categories: Category[] = [
  // ===== GAME OUTCOME (5) =====
  {
    id: 'winner',
    name: 'Super Bowl Winner',
    icon: 'Trophy',
    type: 'outcome',
    options: [
      { id: 'seahawks', label: 'Seattle Seahawks', sublabel: 'NFC Champions' },
      { id: 'patriots', label: 'New England Patriots', sublabel: 'AFC Champions' },
    ]
  },
  {
    id: 'margin',
    name: 'Winning Margin',
    icon: 'ChartBar',
    type: 'outcome',
    options: [
      { id: '1-3', label: '1-3 points', sublabel: 'Nail-biter' },
      { id: '4-7', label: '4-7 points', sublabel: 'Close game' },
      { id: '8-14', label: '8-14 points', sublabel: 'Comfortable' },
      { id: '15-21', label: '15-21 points', sublabel: 'Dominant' },
      { id: '22+', label: '22+ points', sublabel: 'Blowout' },
    ]
  },
  {
    id: 'total-points',
    name: 'Total Points',
    icon: 'Target',
    type: 'outcome',
    options: [
      { id: 'under', label: 'Under 44.5', sublabel: 'Defense wins' },
      { id: 'over', label: 'Over 44.5', sublabel: 'Shootout' },
    ]
  },
  {
    id: 'first-half',
    name: 'First Half Winner',
    icon: 'Timer',
    type: 'outcome',
    options: [
      { id: 'seahawks', label: 'Seattle Seahawks' },
      { id: 'patriots', label: 'New England Patriots' },
      { id: 'tie', label: 'Tie', sublabel: 'Halftime deadlock' },
    ]
  },
  {
    id: 'first-to-score',
    name: 'First Team to Score',
    icon: 'NumberCircleOne',
    type: 'outcome',
    options: [
      { id: 'seahawks', label: 'Seattle Seahawks' },
      { id: 'patriots', label: 'New England Patriots' },
    ]
  },

  // ===== PLAYER PROPS (5) =====
  {
    id: 'mvp',
    name: 'Super Bowl MVP',
    icon: 'Star',
    type: 'player',
    options: [
      { id: 'geno-smith', label: 'Geno Smith', sublabel: 'SEA · QB' },
      { id: 'drake-maye', label: 'Drake Maye', sublabel: 'NE · QB' },
      { id: 'dk-metcalf', label: 'DK Metcalf', sublabel: 'SEA · WR' },
      { id: 'jaxon-smith-njigba', label: 'Jaxon Smith-Njigba', sublabel: 'SEA · WR' },
      { id: 'kenneth-walker', label: 'Kenneth Walker III', sublabel: 'SEA · RB' },
      { id: 'rhamondre-stevenson', label: 'Rhamondre Stevenson', sublabel: 'NE · RB' },
      { id: 'hunter-henry', label: 'Hunter Henry', sublabel: 'NE · TE' },
      { id: 'defensive-player', label: 'Defensive Player', sublabel: 'Any team' },
    ]
  },
  {
    id: 'first-td',
    name: 'First TD Scorer',
    icon: 'PersonSimpleRun',
    type: 'player',
    options: [
      { id: 'dk-metcalf', label: 'DK Metcalf', sublabel: 'SEA · WR' },
      { id: 'jaxon-smith-njigba', label: 'Jaxon Smith-Njigba', sublabel: 'SEA · WR' },
      { id: 'kenneth-walker', label: 'Kenneth Walker III', sublabel: 'SEA · RB' },
      { id: 'tyler-lockett', label: 'Tyler Lockett', sublabel: 'SEA · WR' },
      { id: 'noah-fant', label: 'Noah Fant', sublabel: 'SEA · TE' },
      { id: 'rhamondre-stevenson', label: 'Rhamondre Stevenson', sublabel: 'NE · RB' },
      { id: 'hunter-henry', label: 'Hunter Henry', sublabel: 'NE · TE' },
      { id: 'demario-douglas', label: 'DeMario Douglas', sublabel: 'NE · WR' },
      { id: 'kayshon-boutte', label: 'Kayshon Boutte', sublabel: 'NE · WR' },
      { id: 'antonio-gibson', label: 'Antonio Gibson', sublabel: 'NE · RB' },
      { id: 'other', label: 'Other / Defense / ST', sublabel: 'Anyone else' },
    ]
  },
  {
    id: 'passing-yards',
    name: 'Most Passing Yards',
    icon: 'Football',
    type: 'player',
    options: [
      { id: 'geno-smith', label: 'Geno Smith', sublabel: 'SEA · QB' },
      { id: 'drake-maye', label: 'Drake Maye', sublabel: 'NE · QB' },
    ]
  },
  {
    id: 'rushing-yards',
    name: 'Most Rushing Yards',
    icon: 'SneakerMove',
    type: 'player',
    options: [
      { id: 'kenneth-walker', label: 'Kenneth Walker III', sublabel: 'SEA · RB' },
      { id: 'zach-charbonnet', label: 'Zach Charbonnet', sublabel: 'SEA · RB' },
      { id: 'rhamondre-stevenson', label: 'Rhamondre Stevenson', sublabel: 'NE · RB' },
      { id: 'antonio-gibson', label: 'Antonio Gibson', sublabel: 'NE · RB' },
    ]
  },
  {
    id: 'receiving-yards',
    name: 'Most Receiving Yards',
    icon: 'HandGrabbing',
    type: 'player',
    options: [
      { id: 'dk-metcalf', label: 'DK Metcalf', sublabel: 'SEA · WR' },
      { id: 'jaxon-smith-njigba', label: 'Jaxon Smith-Njigba', sublabel: 'SEA · WR' },
      { id: 'tyler-lockett', label: 'Tyler Lockett', sublabel: 'SEA · WR' },
      { id: 'noah-fant', label: 'Noah Fant', sublabel: 'SEA · TE' },
      { id: 'hunter-henry', label: 'Hunter Henry', sublabel: 'NE · TE' },
      { id: 'demario-douglas', label: 'DeMario Douglas', sublabel: 'NE · WR' },
    ]
  },

  // ===== HALFTIME SHOW (3) =====
  {
    id: 'halftime-length',
    name: 'Halftime Show Length',
    icon: 'Hourglass',
    type: 'halftime',
    options: [
      { id: 'under-13', label: 'Under 13 minutes', sublabel: 'Quick set' },
      { id: '13-14', label: '13-14 minutes', sublabel: 'Standard' },
      { id: '15-plus', label: '15+ minutes', sublabel: 'Extended performance' },
    ]
  },
  {
    id: 'halftime-guests',
    name: 'Guest Performers',
    icon: 'UsersThree',
    type: 'halftime',
    options: [
      { id: '0', label: '0 guests', sublabel: 'Solo show' },
      { id: '1', label: '1 guest' },
      { id: '2-plus', label: '2+ guests', sublabel: 'Star-studded' },
    ]
  },
  {
    id: 'halftime-first-song',
    name: 'First Song',
    icon: 'MusicNotes',
    type: 'halftime',
    options: [
      { id: 'baile-inolvidable', label: 'BAILE INOLVIDABLE' },
      { id: 'la-mudanza', label: 'La MUDANZA' },
      { id: 'titi-me-pregunto', label: 'Tití Me Preguntó' },
      { id: 'monaco', label: 'MONACO' },
      { id: 'other', label: 'Other' },
    ]
  },

  // ===== SUPER BOWL ADS (3) =====
  {
    id: 'ads-dogs',
    name: 'Ads Featuring Dogs',
    icon: 'Dog',
    type: 'ads',
    options: [
      { id: '0-1', label: '0-1 ads' },
      { id: '2-3', label: '2-3 ads' },
      { id: '4-plus', label: '4+ ads', sublabel: 'Puppy Bowl vibes' },
    ]
  },
  {
    id: 'ads-trailers',
    name: 'Movie Trailers Shown',
    icon: 'FilmSlate',
    type: 'ads',
    options: [
      { id: '0-2', label: '0-2 trailers' },
      { id: '3-4', label: '3-4 trailers' },
      { id: '5-plus', label: '5+ trailers', sublabel: 'Hollywood takeover' },
    ]
  },
  {
    id: 'ads-ai',
    name: 'Ads Mentioning AI',
    icon: 'Robot',
    type: 'ads',
    options: [
      { id: '0-1', label: '0-1 ads' },
      { id: '2-3', label: '2-3 ads' },
      { id: '4-plus', label: '4+ ads', sublabel: 'AI overload' },
    ]
  },

  // ===== FUN PROPS (5) =====
  {
    id: 'coin-toss',
    name: 'Coin Toss',
    icon: 'CurrencyCircleDollar',
    type: 'fun',
    options: [
      { id: 'heads', label: 'Heads' },
      { id: 'tails', label: 'Tails' },
    ]
  },
  {
    id: 'anthem-length',
    name: 'National Anthem Length',
    icon: 'Microphone',
    type: 'fun',
    options: [
      { id: 'under', label: 'Under 2:00', sublabel: 'Quick & efficient' },
      { id: 'over', label: 'Over 2:00', sublabel: 'The full experience' },
    ]
  },
  {
    id: 'gatorade',
    name: 'Gatorade Shower Color',
    icon: 'Drop',
    type: 'fun',
    options: [
      { id: 'orange', label: 'Orange' },
      { id: 'blue', label: 'Blue' },
      { id: 'yellow', label: 'Yellow / Green' },
      { id: 'red', label: 'Red / Pink' },
      { id: 'purple', label: 'Purple' },
      { id: 'clear', label: 'Clear / Water' },
    ]
  },
  {
    id: 'first-score-type',
    name: 'First Scoring Play',
    icon: 'ListNumbers',
    type: 'fun',
    options: [
      { id: 'td-pass', label: 'Passing TD' },
      { id: 'td-rush', label: 'Rushing TD' },
      { id: 'fg', label: 'Field Goal' },
      { id: 'safety', label: 'Safety', sublabel: 'Bold pick!' },
    ]
  },
  {
    id: 'q1-turnover',
    name: 'Turnover in Q1?',
    icon: 'ArrowsClockwise',
    type: 'fun',
    options: [
      { id: 'yes', label: 'Yes', sublabel: 'Early chaos' },
      { id: 'no', label: 'No', sublabel: 'Clean start' },
    ]
  },
]

export const categoryGroups = {
  outcome: {
    title: 'Game Outcome',
    subtitle: 'Predict the final result',
    categories: categories.filter(c => c.type === 'outcome')
  },
  player: {
    title: 'Player Props',
    subtitle: 'Who will shine brightest?',
    categories: categories.filter(c => c.type === 'player')
  },
  halftime: {
    title: 'Halftime Show',
    subtitle: 'Bad Bunny takes the stage',
    categories: categories.filter(c => c.type === 'halftime')
  },
  ads: {
    title: 'Super Bowl Ads',
    subtitle: 'The commercials we came for',
    categories: categories.filter(c => c.type === 'ads')
  },
  fun: {
    title: 'Fun Props',
    subtitle: 'The wild cards',
    categories: categories.filter(c => c.type === 'fun')
  }
}
