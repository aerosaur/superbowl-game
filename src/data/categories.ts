export type Option = {
  id: string
  label: string
  sublabel?: string
}

export type Category = {
  id: string
  name: string
  icon: string
  type: 'outcome' | 'player' | 'fun'
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
  fun: {
    title: 'Fun Props',
    subtitle: 'The wild cards',
    categories: categories.filter(c => c.type === 'fun')
  }
}
