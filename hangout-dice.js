var HangoutDice;

HangoutDice = (function() {
  var Alea, Mash, callbacks, dice, id, rollKey;
  
  Mash = function() {
    var mash, n;
    n = 0xefc8249d;
    
    mash = function(data) {
      var h, i;
      data = data.toString();
      i = 0;
      while (i < data.length) {
        n += data.charCodeAt(i);
        h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000;
        i++;
      }
      return (n >>> 0) * 2.3283064365386963e-10;
    };
    
    mash.version = "Mash 0.9";
    return mash;
  };
  
  Alea = function() {
    return (function(args) {
      var c, i, mash, random, s0, s1, s2;
      s0 = 0;
      s1 = 0;
      s2 = 0;
      c = 1;
      
      if (args.length === 0) {
        args = [+(new Date)];
      }
      
      mash = Mash();
      s0 = mash(" ");
      s1 = mash(" ");
      s2 = mash(" ");
      i = 0;
      
      while (i < args.length) {
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
        i++;
      }
      
      mash = null;
      
      random = function() {
        var t;
        t = 2091639 * s0 + c * 2.3283064365386963e-10;
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
      };
      
      random.uint32 = function() {
        return random() * 0x100000000;
      };
      
      random.fract53 = function() {
        return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16;
      };
      
      random.version = "Alea 0.9";
      random.args = args;
      return random;
    })(Array.prototype.slice.call(arguments_));
  };
  
  id = null;
  dice = {};
  callbacks = {};
  rollKey = "HangoutDice.roll";
  
  dice.roll = function(num, sides, callback) {
    var delta, rollPayload, timestamp;
    timestamp = +(new Date);
    
    if (callback) {
      callbacks[timestamp] = callback;
    }
    
    rollPayload = JSON.stringify({
      timestamp: timestamp,
      id: id,
      num: num,
      sides: sides
    });
    
    delta = {};
    delta[rollKey] = rollPayload;
    return gapi.hangout.data.submitDelta(delta, []);
  };
  
  dice.onRoll = function() {};
  
  gapi.hangout.onApiReady.add(function() {
    id = gapi.hangout.getParticipantId();
    
    return gapi.hangout.data.onStateChanged.add(function(e) {
      var i, idx, obj, rand, roll, _results;
      idx = 0;
      _results = [];
      
      while (idx < e.addedKeys.length) {
        obj = e.addedKeys[idx];
        if (obj.key === rollKey) {
          roll = JSON.parse(obj.value);
          roll.rolls = [];
          rand = Alea(obj.timestamp);
          i = 0;
          
          while (i < roll.num) {
            roll.rolls.push((rand.uint32() % roll.sides) + 1);
            i++;
          }
          
          if (callbacks[roll.timestamp]) {
            callbacks[roll.timestamp](roll, rand);
            callbacks[roll.timestamp] = null;
          }
          dice.onRoll(roll, rand);
        }
        _results.push(idx++);
      }
      return _results;
    });
  });
  return dice;
})();