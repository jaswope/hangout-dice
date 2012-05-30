var HangoutDice = (function() {
  var id = null;

  var dice = {};
  var callbacks = {};

  function Mash() {
    var n = 0xefc8249d;
 
    var mash = function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
 
    mash.version = 'Mash 0.9';
    return mash;
  }

  function Alea() {
    return (function(args) {
      // Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
      var s0 = 0;
      var s1 = 0;
      var s2 = 0;
      var c = 1;

      if (args.length == 0) {
        args = [+new Date];
      }
      var mash = Mash();
      s0 = mash(' ');
      s1 = mash(' ');
      s2 = mash(' ');

      for (var i = 0; i < args.length; i++) {
        s0 -= mash(args[i]);
        if (s0 < 0) {
          s0 += 1;
        }
        s1 -= mash(args[i]);
        if (s1 < 0) {
          s1 += 1;
        }
        s2 -= mash(args[i]);
        if (s2 < 0) {
          s2 += 1;
        }
      }
      mash = null;

      var random = function() {
        var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
      };
      random.uint32 = function() {
        return random() * 0x100000000; // 2^32
      };
      random.fract53 = function() {
        return random() + 
          (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
      };
      random.version = 'Alea 0.9';
      random.args = args;
      return random;

    } (Array.prototype.slice.call(arguments)));
  };

  var rollKey = "HangoutDice.roll";

  dice.roll = function(num, sides, callback) {
    var timestamp = (+new Date);
    if (callback)
      callbacks[timestamp] = callback;
    var rollPayload = JSON.stringify({
      timestamp: timestamp,
      id: id,
      num: num,
      sides: sides
    });
    var delta = {};
    delta[rollKey] = rollPayload;
    gapi.hangout.data.submitDelta(delta, []);
  }

  dice.onRoll = function() {}

  gapi.hangout.onApiReady.add(function() {
    id = gapi.hangout.getParticipantId();

    gapi.hangout.data.onStateChanged.add(function(e) {
      for(var idx = 0; idx < e.addedKeys.length; idx++) {
        var obj = e.addedKeys[idx];
        if (obj.key == rollKey) {
          var roll = JSON.parse(obj.value);
          roll.rolls = [];
          var rand = Alea(obj.timestamp);
          for (var i=0;i<roll.num;i++)
            roll.rolls.push((rand.uint32() % roll.sides) + 1);
          if (callbacks[roll.timestamp]) {
            callbacks[roll.timestamp](roll, rand);
            callbacks[roll.timestamp] = null;
          }
          dice.onRoll(roll, rand);
        }
      }
    });
  });

  return dice;
})();
