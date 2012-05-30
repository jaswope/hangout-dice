Hangout Dice
============

Hangout Dice is a library for generating dice rolls in a Google+ hangout. It uses the ms precision of the event metatdata in the shared state object to provide the entropy for the rolls, and a pure JS random number implementation to allow all connected clients see the same results for any given roll.

Usage
=====

Usage is pretty simple.  After you include the js file, the variable HangoutDice will be added to the global namespace. First set HangoutDice.onRoll to a function that takes an object as a callback.  The object will be formatted as follows:
```javascript
{
  rolls: [1,5,6],        // Array of rolls that were requested
  num: 3,                // Number of dice rolled
  sides: 6,              // Number of sides on the dice
  id: "123$google/456",  // Participant ID of the roller
  timestamp: 1234567890  // Cachebuster, can be ignored
}
```

To trigger a roll, call HangoutDice.roll(num, sides).  It can take a third optional parameter that is a local callback for the roll.  Keep in mind that the global callback will still fire. 
