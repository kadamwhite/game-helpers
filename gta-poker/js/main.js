/* eslint-disable no-unused-vars */
const suits = [ '♠', '♣', '♥', '♦' ];
const values = [ 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ];
const valueMappings = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};
const cards = suits.reduce( ( cards, suit ) => {
  values.forEach( ( value ) => {
    const face = valueMappings[value] || value;
    cards.push( {
      name: `${ suit }${ face }`,
      suit,
      face,
      value,
    } );
  } );
  return cards;
}, [] );

// Helpers
const write = html => {
  const output = document.querySelector( '.output' );
  output.innerHTML = [
    output.innerHTML,
    html,
  ].join( '' );
};
const replace = html => {
  document.querySelector( '.output' ).innerHTML = html;
};
const getValue = card => card.value;
const getName = card => card.name;
const printHand = hand => hand.map( getName ).join( ', ' );
const last = cards => cards[cards.length - 1];
const ascending = comparator => ( a, b ) => comparator( a ) - comparator( b );
const sequence = ( fn ) => new Promise( resolve => {
  fn();
  setTimeout( resolve, 0 );
} );
const wait = ( ms ) => new Promise( resolve => setTimeout( resolve, ms ) );

// Deck logic
function draw( count, deck ) {
  const localDeck = deck || [ ...cards ];
  return Array.from( { length: count } )
    .map( () => {
      if ( ! localDeck.length ) {
        return null;
      }
      const idx = Math.floor( Math.random() * localDeck.length );
      const removed = localDeck.splice( idx, 1 );
      return removed[0];
    } )
    .filter( Boolean );
}

function handDetails( cards ) {
  const sorted = cards.sort( ascending( getValue ) );

  const counts = cards.reduce( ( counts, card ) => ( {
    ...counts,
    [card.value]: counts[card.value] ? counts[card.value] + 1 : 1,
  } ), {} );

  const repeatedCards = Object.keys( counts )
    .filter( key => counts[ key ] > 1 );
  const repeatedCard = repeatedCards.length
    ? +repeatedCards[0]
    : null;
  const distinguishingCard = repeatedCard || sorted[2].value;

  const isFlush = (
    sorted[0].suit === sorted[1].suit
  ) && (
    sorted[1].suit === sorted[2].suit
  );
  const isStraight = (
    ( sorted[0].value + 1 === sorted[1].value ) && ( sorted[1].value + 1 === sorted[2].value )
  ) || (
    // Handle Ace-Low
    sorted[0].value === 2 && sorted[1].value === 3 && sorted[2].value === 14
  );

  const isStraightFlush = isStraight && isFlush;

  const isThreeOfKind = repeatedCard ? counts[repeatedCard] === 3 : false;
  const isPair = repeatedCard ? counts[repeatedCard] === 2 : false;

  // eslint-disable-next-line max-len
  const isPlayableByDealer = isFlush || isStraight || isPair || isThreeOfKind || distinguishingCard >= 12;

  let rank;
  if ( isStraightFlush ) {
    rank = 6;
  } else if ( isThreeOfKind ) {
    rank = 5;
  } else if ( isStraight ) {
    rank = 4;
  } else if ( isFlush ) {
    rank = 3;
  } else if ( isPair ) {
    rank = 2;
  } else {
    rank = 1;
  }

  const details = {
    isStraightFlush,
    isFlush,
    isStraight,
    isThreeOfKind,
    isPair,
    isPlayableByDealer,
    distinguishingCard,
    rank,
  };

  return details;
}

function describeHandFromDetails( details, isDealer ) {
  if ( details.isStraightFlush ) {
    return `${ details.getDistinguishingCardName }-high straight flush`;
  }
  if ( details.isThreeOfKind ) {
    return `Three ${ details.getDistinguishingCardName }s`;
  }
  if ( details.isStraight ) {
    return `${ details.getDistinguishingCardName }-high straight`;
  }
  if ( details.isFlush ) {
    return `${ details.getDistinguishingCardName }-high flush`;
  }
  if ( details.isPair ) {
    return `Pair of ${ details.getDistinguishingCardName }s`;
  }
  const highCard = `${ details.getDistinguishingCardName }-high`;
  if ( ! isDealer ) {
    return highCard;
  }
  return details.isPlayableByDealer
    ? highCard
    : `${ highCard } (dealer does not play)`;
}

// function isFlush( cards ) {
//   const suit = cards[0].suit;
//   return cards.reduce( ( isFlush, card ) => {
//     return isFlush && card.suit === suit;
//   }, true );
// }

// function isStraight( cards ) {
//   const sorted = cards.sort( ascending( getValue ) );
//   return sorted.reduce( ( isStraight, card, idx ) => {
//     if ( idx === 0 ) {
//       return isStraight;
//     }
//     return isStraight && ( sorted[idx - 1].value + 1 ) === card.value;
//   }, true );
// }

// function isStraightFlush( cards ) {
//   return isStraight( cards ) && isFlush( cards );
// }
// function countMatches( cards ) {
//   const counts = countValues( cards );
//   return Object.keys( counts ).reduce(
//     ( maxCount, value ) => Math.max( maxCount, counts[ value ] ),
//     0
//   );
// }

// function getHighCardValue( cards ) {
//   const values = Object.keys( countValues( cards ) )
//     .map( key => +key )
//     .sort( ( a, b ) => a - b );
//   return values[ values.length - 1];
// }
// function getHighCardName( card ) {
//   return valueMappings[getHighCardValue( card )];
// }

// /** Get the value of the cards foriming a pair or three-of-kind */
// function getRepeatedCardValue( cards ) {
//   const counts = countValues( cards );
//   const values = Object.keys( counts )
//     .filter( key => counts[ key ] > 1 )
//     .map( key => +key )
//     .sort( ( a, b ) => a - b );
//   if ( ! values.length ) {
//     return 0;
//   }
//   return values[ values.length - 1];
// }
// function getRepeatedCardName( cards ) {
//   return valueMappings[getRepeatedCardValue( cards )];
// }

// /** Get the value of a paired/tripled card, or high card */
// function getDistinguishingCardValue( hand ) {
//   const repeatedCardValue = getRepeatedCardValue( hand );
//   if ( repeatedCardValue ) {
//     return repeatedCardValue;
//   }
//   return getHighCardValue( hand );
// }
// function getDistinguishingCardName( hand ) {
//   return valueMappings[getDistinguishingCardValue( hand )];
// }

// function isPair( hand ) {
//   return countMatches( hand ) === 2;
// }
// function isThreeOfKind( hand ) {
//   return countMatches( hand ) === 3;
// }
// function isPlayableByDealer( hand ) {
//   return last( hand.sort( ascending( getValue ) ) ).value >= 12;
// }

// function describeHand( hand, isDealer ) {
//   if ( isStraightFlush( hand ) ) {
//     return `${ getDistinguishingCardName( hand ) }-high straight flush`;
//   }
//   if ( isThreeOfKind( hand ) ) {
//     return `Three ${ getDistinguishingCardName( hand ) }s`;
//   }
//   if ( isStraight( hand ) ) {
//     return `${ getDistinguishingCardName( hand ) }-high straight`;
//   }
//   if ( isFlush( hand ) ) {
//     return `${ getDistinguishingCardName( hand ) }-high flush`;
//   }
//   if ( isPair( hand ) ) {
//     return `Pair of ${ getDistinguishingCardName( hand ) }s`;
//   }
//   const highCard = `${ getDistinguishingCardName( hand ) } high`;
//   if ( ! isDealer ) {
//     return highCard;
//   }
//   return isPlayableByDealer( hand ) ? highCard : `${ highCard } (dealer folds)`;
// }
// function getHandRank( hand ) {
//   if ( isStraightFlush( hand ) ) {
//     return 6;
//   }
//   if ( isThreeOfKind( hand ) ) {
//     return 5;
//   }
//   if ( isStraight( hand ) ) {
//     return 4;
//   }
//   if ( isFlush( hand ) ) {
//     return 3;
//   }
//   if ( isPair( hand ) ) {
//     return 2;
//   }
//   return 1;
// }

// Compete old-style
// function compete( playerHand, dealerHand ) {
//   const playerHandRank = getHandRank( playerHand );
//   const playerDistCard = getDistinguishingCardValue( playerHand );
//   const dealerHandRank = getHandRank( dealerHand );
//   const dealerDistCard = getDistinguishingCardValue( dealerHand );
//   if ( playerHandRank > dealerHandRank ) {
//     return playerHand;
//   }
//   if ( dealerHandRank > playerHandRank ) {
//     return dealerHand;
//   }
//   // Hands are same rank; compare on card values.
//   // But make sure dealer can play, first: Dealer needs Q-high or better.
//   if ( dealerHandRank === 1 ) {
//     if ( dealerDistCard < 12 ) {
//       return playerHand;
//     }
//   }
//   if ( playerDistCard > dealerDistCard ) {
//     return playerHand;
//   }
//   return dealerHand;
// }

function compete( playerDetails, dealerDetails ) {

  // Make sure dealer can play, first: Dealer needs Q-high or better.
  if ( ! dealerDetails.isPlayableByDealer ) {
    return playerDetails;
  }

  if ( playerDetails.rank > dealerDetails.rank ) {
    return playerDetails;
  }
  if ( dealerDetails.rank > playerDetails.rank ) {
    return dealerDetails;
  }

  // Hands are same rank; compare on card values.
  if ( playerDetails.distinguishingCard > dealerDetails.distinguishingCard ) {
    return playerDetails;
  }
  if ( playerDetails.distinguishingCard < dealerDetails.distinguishingCard ) {
    return dealerDetails;
  }
  // @TODO: Handle second-value card for tiebreakers. For now, assume dealer wins.
  return dealerDetails;
}

const ASSUMED_GAME_DURATION = 40; // seconds it takes to play a game
const ASSUMED_REST_PERIOD = 150; // seconds you'll wait before playing another game if you lose

function getPayout( playerCards, dealerCards, ante, pairPlus ) {
  const playerHand = handDetails( playerCards );
  const dealerHand = handDetails( dealerCards );

  const winner = compete( playerHand, dealerHand );
  if ( winner === dealerHand ) {
    return {
      payout: 0,
      time: ASSUMED_GAME_DURATION + ASSUMED_REST_PERIOD, // seconds from start of game to next game
    };
  }

  let anteBonus = 0;
  let pairPlusPayout = 0;
  if ( playerHand.isStraightFlush ) {
    anteBonus = ante * 5;
    pairPlusPayout = pairPlus * 40;
  } else if ( playerHand.isThreeOfKind ) {
    anteBonus = ante * 4;
    pairPlusPayout = pairPlus * 30;
  } else if ( playerHand.isStraight ) {
    anteBonus = ante;
    pairPlusPayout = pairPlus * 6;
  } else if ( playerHand.isFlush ) {
    pairPlusPayout = pairPlus * 4;
  } else if ( playerHand.isPair ) {
    pairPlusPayout = pairPlus;
  } else {
    pairPlusPayout = -pairPlus;
  }

  if ( dealerHand.isPlayableByDealer ) {
    return {
      payout: 2 * ante + anteBonus + pairPlusPayout,
      time: ASSUMED_GAME_DURATION,
    };
  }
  return {
    payout: ante + anteBonus + pairPlusPayout,
    time: ASSUMED_GAME_DURATION,
  };
}

function playHand( chips, timeElapsed ) {
  const deck = [ ...cards ];
  const playerHand = draw( 3, deck );
  const dealerHand = draw( 3, deck );
  const ante = Math.min( 50000, Math.floor( chips / 2 ) );
  const pairPlus = Math.min(
    5000,
    Math.floor( Math.floor( ( chips - ante * 2 ) / 1000 ) * 1000 )
  );
  const game = getPayout( playerHand, dealerHand, ante, pairPlus );
  return {
    chips: chips + game.payout,
    time: timeElapsed + game.time,
  };
}


// const deck = cards;
// const handPairs = [];
// while ( deck.length >= 6 ) {
//   handPairs.push( [ draw( 3, deck ), draw( 3, deck ) ] );
// }

// /* eslint-disable indent */
// document.querySelector( '.output' ).innerHTML = `
// <table>
//   <thead>
//     <td>Player Hand</td>
//     <td>Dealer Hand</td>
//     <td>Result</td>
//   </thead>
//   <tbody>
//     ${ handPairs.map( ( [ playerHand, dealerHand ] ) => `
//     <tr>
//       <td>
//         <div>${ printHand( playerHand ) }</div>
//         <div><em>(${ describeHand( playerHand ) })</em></div>
//       </td>
//       <td>
//         <div>${ printHand( dealerHand ) }</div>
//         <div><em>(${ describeHand( dealerHand ) })</em></div>
//       </td>
//       <td>${
//         compete( playerHand, dealerHand ) === playerHand
//           ? `player wins; ${ ( () => {
//             const payout = getPayout( playerHand, dealerHand );
//             return payout ? `${ payout }x` : 'no';
//           } )() } payout`
//           : 'dealer wins'
//       }</td>
//     </tr>
//     ` ) }
//   </tbody>
// </table>`;

const secondsToTime = s => {
  const d = new Date( 0 );
  d.setSeconds( s );
  return d.toISOString()
    .replace( /1970-01-01T/u, '' )
    .replace( '.000Z', '' )
    .replace( /^0+/u, '' )
    .replace( /^:/u, '' )
    .replace( /^0+/u, '' );
};

const avg = ( arr, accessor ) => {
  const sum = arr
    .map( accessor )
    .reduce( ( sum, rounds ) => sum + rounds, 0 );
  return Math.floor( sum / arr.length );
};

async function getExpectedValueAfterRounds( numRounds ) {
  const rounds = [];
  for ( let r = 0; r < 1000; r++ ) {
    if ( r % 50 === 0 ) {
      // eslint-disable-next-line no-await-in-loop
      await wait( 0 );
    }

    // Initial game state
    let game = {
      chips: 100000,
      time: 0,
    };
    for ( let i = 0; i < numRounds; i++ ) {
      game = playHand( game.chips, game.time );
      console.log( game );
    }
    rounds.push( game );
  }
  window.rounds = rounds;
  return {
    chips: avg( rounds, r => r.chips ),
    time: secondsToTime( avg( rounds, r => r.time ) ),
  };
}

/* eslint-disable indent */
let table = `
<table>
  <thead>
    <td>Round</td>
    <td>Average Chips</td>
    <td>Average Time</td>
  </thead>
  <tbody>
`;

let idx = 1;
/* eslint-disable no-await-in-loop */
( async () => {
  for ( let _ of Array.from( { length: 50 } ) ) {
    const expected = await getExpectedValueAfterRounds( idx );
    table = `
    ${ table }
    <tr>
      <td>${ idx }</td>
      <td>${ expected.chips }</td>
      <td>${ expected.time }</td>
    </tr>
    `;
    replace( `${ table }</tbody><table>` );
    await wait( 17 );
    idx = idx + 1;
  }
} )();

// write( `
//   </tbody>
// </table>
// ` );

// document.querySelector( '.output' ).innerHTML = `Expected result: ${
//   Math.round(
//     rounds.reduce( ( sum, rounds ) => sum + rounds, 0 ) / rounds.length
//   )
// }`;
