window.__ascf = {
  capitalize(value) {
    if (!value) return ''
    value = value.charAt(0).toUpperCase() + value.slice(1);
    return value
  },

  priceFormatter(value) {
    if (!value) return ''
    value = value / 100
    value = parseFloat(value).toFixed(2).toString().replace('.', ',') + ' €'
    return value
  },

  cleanJson(value) {
    if (!value) return ''
    value = value.replace(/\n/g, " ")
    return value
  },

  priceFormatterWithDiscount(value, discount) {
    if (!value) return ''
    discount = (100 - discount) * 0.01;
    value = value * discount;
    value = Math.round((value + Number.EPSILON) * 100) / 100;
    value = parseFloat(value).toFixed(2).toString().replace('.', ',') + ' €'
    return value
  },

  currencyFormatter(currency) {
    if (!currency) return ''
    if (currency === 'eur') { currency = '€' }
    if (currency === 'usd') { currency = '$' }
    if (currency === 'cad') { currency = '$CAD' }
    if (currency === 'chf') { currency = 'CHF' }
    return currency
  },

  dateUnitFormatter(unit) {
    if (!unit) return ''
    if (unit.toLowerCase() === 'day') { unit = 'jours' }
    if (unit.toLowerCase() === 'days') { unit = 'jours' }
    if (unit.toLowerCase() === 'week') { unit = 'semaines' }
    if (unit.toLowerCase() === 'weeks') { unit = 'semaines' }
    if (unit.toLowerCase() === 'month') { unit = 'mois' }
    if (unit.toLowerCase() === 'months') { unit = 'mois' }
    if (unit.toLowerCase() === 'year') { unit = 'années' }
    if (unit.toLowerCase() === 'years') { unit = 'années' }
    return unit
  },

  toSingular(unit) {
    if (!unit) return ''
    unit = unit.substring(0, unit.length - +(unit.lastIndexOf('s') == unit.length - 1));
    return unit
  },

  dateFormatterLong(date) {
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    var d = new Date(date),
      month = monthNames[d.getMonth()],
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (day.length < 2)
      day = '0' + day;
    date = day + ' ' + month + ' ' + year
    return date
  },

  dateTimeFormatter(date) {
    var output = "";

    var d = new Date(date),
      sec = '' + d.getSeconds(),
      min = '' + (d.getMinutes()),
      day = '' + d.getDate(),
      hour = '' + (d.getHours()),
      month = '' + (d.getMonth() + 1),
      year = '' + d.getFullYear();

    month = (month.length < 2 ? '0' : '') + month;
    day = (day.length < 2 ? '0' : '') + day;

    //  if (general_config.date_format === "yyyy-mm-dd") { date = [year, month, day].join('-') }
    //  else if (general_config.date_format === "dd-mm-yyyy") { date = [day, month, year].join('-') }
    //  else if (general_config.date_format === "dd/mm/yyyy") { date = [day, month, year].join('/') }
    //  else if (general_config.date_time_format === "yyyy-mm-dd hh:mm") { date = [year, month, day].join('-') + ' ' + [hour, min].join(':') }
    //  else 
    if (general_config.date_format)
      date = general_config.date_format
        .replace('yyyy', year)
        .replace('dd', day)
        .replace('mm', month) // first mm should be replaced by month.
        .replace('hh', hour)
        .replace('mm', min) // second mm should be replaced by minute.
        .replace('ss', sec) // second mm should be replaced by minute.
    else
      output = d.toISOString();

    return output
  },
  // Ref: https://gist.github.com/stewartknapman/8d8733ea58d2314c373e94114472d44c
  formatMoney : function(cents, format) {
    if (typeof cents == 'string') { cents = cents.replace('.',''); }
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = (format || this.money_formats);
  
    function defaultOption(opt, def) {
       return (typeof opt == 'undefined' ? def : opt);
    }
  
    function formatWithDelimiters(number, precision, thousands, decimal) {
      precision = defaultOption(precision, 2);
      thousands = defaultOption(thousands, ',');
      decimal   = defaultOption(decimal, '.');
  
      if (isNaN(number) || number == null) { return 0; }
  
      number = (number/100.0).toFixed(precision);
  
      var parts   = number.split('.'),
          dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
          cents   = parts[1] ? (decimal + parts[1]) : '';
  
      return dollars + cents;
    }
  
    switch(formatString.match(placeholderRegex)[1]) {
      case 'default':
        value = formatWithDelimiters(cents, 2);
        break;
      case 'without_trailing_zeros':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'without_trailing_zeros_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
    }
  
    return formatString.replace(placeholderRegex, value);
  },
  replace : function (str, toReplace, replaceWith) {
    return str.replace(toReplace, replaceWith);
  }
}
