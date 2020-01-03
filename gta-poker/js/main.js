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

function isFlush( cards ) {
  const suit = cards[0].suit;
  return cards.reduce( ( isFlush, card ) => {
    return isFlush && card.suit === suit;
  }, true );
}

function isStraight( cards ) {
  const sorted = cards.sort( ascending( getValue ) );
  return sorted.reduce( ( isStraight, card, idx ) => {
    if ( idx === 0 ) {
      return isStraight;
    }
    return isStraight && ( sorted[idx - 1].value + 1 ) === card.value;
  }, true );
}

function isStraightFlush( cards ) {
  return isStraight( cards ) && isFlush( cards );
}

function countValues( cards ) {
  return cards.reduce( ( counts, card ) => ( {
    ...counts,
    [card.value]: counts[card.value] ? counts[card.value] + 1 : 1,
  } ), {} );
}
function countMatches( cards ) {
  const counts = countValues( cards );
  return Object.keys( counts ).reduce(
    ( maxCount, value ) => Math.max( maxCount, counts[ value ] ),
    0
  );
}

function getHighCardValue( cards ) {
  const values = Object.keys( countValues( cards ) )
    .map( key => +key )
    .sort( ( a, b ) => a - b );
  return values[ values.length - 1];
}
function getHighCardName( card ) {
  return valueMappings[getHighCardValue( card )];
}

/** Get the value of the cards foriming a pair or three-of-kind */
function getRepeatedCardValue( cards ) {
  const counts = countValues( cards );
  const values = Object.keys( counts )
    .filter( key => counts[ key ] > 1 )
    .map( key => +key )
    .sort( ( a, b ) => a - b );
  if ( ! values.length ) {
    return 0;
  }
  return values[ values.length - 1];
}
function getRepeatedCardName( cards ) {
  return valueMappings[getRepeatedCardValue( cards )];
}

/** Get the value of a paired/tripled card, or high card */
function getDistinguishingCardValue( hand ) {
  const repeatedCardValue = getRepeatedCardValue( hand );
  if ( repeatedCardValue ) {
    return repeatedCardValue;
  }
  return getHighCardValue( hand );
}
function getDistinguishingCardName( hand ) {
  return valueMappings[getDistinguishingCardValue( hand )];
}

function isPair( hand ) {
  return countMatches( hand ) === 2;
}
function isThreeOfKind( hand ) {
  return countMatches( hand ) === 3;
}
function isPlayableByDealer( hand ) {
  return last( hand.sort( ascending( getValue ) ) ).value >= 12;
}

function describeHand( hand, isDealer ) {
  if ( isStraightFlush( hand ) ) {
    return `${ getDistinguishingCardName( hand ) }-high straight flush`;
  }
  if ( isThreeOfKind( hand ) ) {
    return `Three ${ getDistinguishingCardName( hand ) }s`;
  }
  if ( isStraight( hand ) ) {
    return `${ getDistinguishingCardName( hand ) }-high straight`;
  }
  if ( isFlush( hand ) ) {
    return `${ getDistinguishingCardName( hand ) }-high flush`;
  }
  if ( isPair( hand ) ) {
    return `Pair of ${ getDistinguishingCardName( hand ) }s`;
  }
  const highCard = `${ getDistinguishingCardName( hand ) } high`;
  if ( ! isDealer ) {
    return highCard;
  }
  return isPlayableByDealer( hand ) ? highCard : `${ highCard } (dealer folds)`;
}
function getHandRank( hand ) {
  if ( isStraightFlush( hand ) ) {
    return 6;
  }
  if ( isThreeOfKind( hand ) ) {
    return 5;
  }
  if ( isStraight( hand ) ) {
    return 4;
  }
  if ( isFlush( hand ) ) {
    return 3;
  }
  if ( isPair( hand ) ) {
    return 2;
  }
  return 1;
}

function compete( playerHand, dealerHand ) {
  const playerHandRank = getHandRank( playerHand );
  const playerDistCard = getDistinguishingCardValue( playerHand );
  const dealerHandRank = getHandRank( dealerHand );
  const dealerDistCard = getDistinguishingCardValue( dealerHand );
  if ( playerHandRank > dealerHandRank ) {
    return playerHand;
  }
  if ( dealerHandRank > playerHandRank ) {
    return dealerHand;
  }
  // Hands are same rank; compare on card values.
  // But make sure dealer can play, first: Dealer needs Q-high or better.
  if ( dealerHandRank === 1 ) {
    if ( dealerDistCard < 12 ) {
      return playerHand;
    }
  }
  if ( playerDistCard > dealerDistCard ) {
    return playerHand;
  }
  return dealerHand;
}

function getPayout( playerHand, dealerHand ) {
  const winner = compete( playerHand, dealerHand );
  if ( winner === dealerHand ) {
    return 0;
  }
  if ( isPlayableByDealer( dealerHand ) ) {
    return 2;
  }
  return 1.5;
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

async function getExpectedValueAfterRounds( numRounds ) {
  const rounds = [];
  for ( let r = 0; r < 1000; r++ ) {
    let chips = 10;
    for ( let i = 0; i < numRounds; i++ ) {
      if ( r % 100 === 0 ) {
        // eslint-disable-next-line no-await-in-loop
        await wait( 0 );
      }
      const deck = [ ...cards ];
      const playerHand = draw( 3, deck );
      const dealerHand = draw( 3, deck );
      const ante = Math.min( 5, Math.floor( chips / 2 ) );
      const payout = getPayout( playerHand, dealerHand );
      if ( payout ) {
        chips = chips + Math.floor( payout * ante );
      } else {
        // Simulate loss of chips due to saving glitch.
        // eslint-disable-next-line no-lonely-if
        if ( Math.random() < 0.3 ) {
          chips = chips - ante;
        }
        // chips = chips - ante;
      }
    }
    rounds.push( chips );
  }
  return Math.round(
    rounds.reduce( ( sum, rounds ) => sum + rounds, 0 ) / rounds.length
  );
}

/* eslint-disable indent */
let table = `
<table>
  <thead>
    <td>Round</td>
    <td>Average Chips</td>
  </thead>
  <tbody>
`;

let idx = 1;
/* eslint-disable no-await-in-loop */
( async () => {
  for ( let _ of Array.from( { length: 30 } ) ) {
    const expected = await getExpectedValueAfterRounds( idx );
    table = `
    ${ table }
    <tr>
      <td>${ idx }</td>
      <td>${ expected * 10000 }</td>
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
