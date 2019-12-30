var form = document.querySelector('form.horse-odds');

function oddsToPercentage(odds) {
  if (! odds ) {
    return 0;
  }
  return 1 / (odds + 1);
}

function getHorseOdds() {
  var horseInputNodes = [].slice.call(document.querySelectorAll('.horse-odds__input'));
  return horseInputNodes.map(function(node) {
    return node.value ? +node.value : 0;
  });
}

function getHorsePercentages() {
  return getHorseOdds().map(oddsToPercentage);
}

function getTotalPercentages() {
  return getHorsePercentages().reduce(function(sum, pct) {
    return sum + pct;
  }, 0);
}

function getHorseOutputNode(idx) {
  return document.querySelector(`.horse-odds__percentage[data-horse="${ idx + 1 }"]`);
}

document.querySelectorAll('.horse-odds__input').forEach(function(input) {
  input.addEventListener('focus', function(evt) {
    evt.target.value = '';
  });
});

function toPct(val, digits) {
  return `${ (val * 100).toFixed(digits || 2)}%`;
}

form.addEventListener('change', function(evt) {
  var value = evt.target.value;
  var horse = evt.target.dataset.horse;

  // Update posted percentages
  var percentages = getHorsePercentages();
  console.log(percentages);

  // Update total.
  var total = getTotalPercentages();
  var oddsSummary = document.querySelector('.horse-odds__total-percentage');
  if (total < 0.8) {
    oddsSummary.innerHTML = 'Odds are very good.';
  } else if (total < 1) {
    oddsSummary.innerHTML = 'Odds are better than posted.';
  } else {
    oddsSummary.innerHTML = 'Odds are worse than posted.';
  }

  // Update per-horse odds.
  var actuals = [];
  percentages.forEach(function(pct, idx) {
    var output = getHorseOutputNode(idx);

    if (! pct ) {
      output.innerHTML = '';
      return;
    }

    var pctAdjustment = (pct / total) * (1 - total );
    var actualPct = pct + pctAdjustment;
    output.innerHTML = `(${ toPct(actualPct, 1) })`;
    if (actualPct > 0.4) {
      output.innerHTML = `<strong>${ output.innerHTML }</strong>`;
    }

    actuals.push(actualPct);
  });

  // Figure out best horse.
  var best = {
    horse: [0],
    pct: -Infinity,
  };
  actuals.forEach(function(pct, idx) {
    if (best.pct < pct) {
      best = {
        horse: [idx],
        pct: pct,
      };
    } else if (best.pct === pct) {
      best.horse.push(idx);
    }
  });
  document.querySelector('.horse-odds__advice').innerHTML = `Bet on horse${
    best.horse.length > 1 ? 's' : ''
  } ${ best.horse.map(function(idx) {
    return `#${ idx + 1 }`;
  }).join(' or ') }`;
});
