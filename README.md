sauce4zwift Club Ladder Live Score
========

Changes v0.2.1 - Nov 2025
-------------------------

* Applied the Onno Fix (Thanks Onno) - check out his excellent sauce mods [Sauce Discord Channel](https://discord.com/channels/744994375469367316/1187497848133140654)

Changes v0.1.1 - Oct 2025
-------------------------

* Fixed the code (again) - despite working fine twice, had to resolve a circular dep.

Changes v0.1.0 - Sep 2025
-------------------------

* Fixed and revamped code
* Window now moves again, T and P toggle the main score and rider scores elements
* Esc reloads (if the distances get screwed)

Changes v0.0.6 - March 2025
---------------------------
* Reworked logic to remove circular nonsense
* Added breakaway grouping indicator
* Add a rider (key A) allows you to add riders (untested)
* Adjusted look of the widget slightly (removed rounding)

Changes v0.0.5 - May 2024
-------------------------
* Made team text color contrast with background so we can see it.
* Reworked finish code to check for leaving an event [untested]

Changes v0.0.4 - March 2024
---------------------------

* Make the teams use club colours. (This may be horrible for some teams)
* added experimental "gap" feature - H key toggles on off **untested**
* added a bit of testing for "finished" state.

Changelog December 2023
-----------------------

* Added code to make sure scoring is the current in use system.

Changelog 15th Sepc 23 v 0.0.3
------------------------------

* Fixed situations where more than 5 were signed in and one of the riders was 6th in the list.
* "Finish" situations are still not handled well - becuase of riders leaving the race at the finish line.

Changelog 7th Aug 23 v 0.0.2
--------------------

* Initial testing complete
* Fixed ordering bug, slowed down updates to nearer 2s as 1s was too quick to get all athletes data refreshed.
* Fixed resize bug where vertical items scaled but wouldn't "bunch up"
* Still Experimental status, but should at least work.

Changelog 3 Aug 23
------------------
*EXPERIMENTAL MODE*

I have reworked the mod to use different sauce api endpoints.
This means there is no guarantee this version of the mod works *at all*.

I advise you to avoid this release until I've tested it in a ladder match.
Specifically some code added to catch the finish of the race - which is hacky.

Changelog 1 Aug 23
------------------
Made resizing work (a bit)
- I know that I currently use "nearby" data for this widget - it is less than ideal if someone is dropped and not near the rider being watched - I will try to get this fixed in the next update

- To resize you might want to hit the "up arrow" key on the keyboard which changes the background transparency/opacity
- dn arrow does the opposite.

Installing
--------
A Sauce for Zwift "Mod" is a directory placed in `~/Documents/SauceMods`.  NOTE: "Documents"
may be called "My Documents" on some platforms.  For first time mod users they should create
an empty **SauceMods** folder first.  Then each Mod will be a sub directory in there such as...
```
Documents
└── SauceMods
    ├── <Put me here>
```

Usage
--------
Turn the mod on in sauce settings.
The window can be moved by clicking on it and there is some rudimentary resizing if you go near the edges (This needs work)

It will take the ID of the rider you are watching and ask the ladder system if they are in a live fixture.
If they are it will attempt to live score that fixture with the data from anyone it finds.

If someone has opted out of sauce by asking to be blacklisted that will mean sauce is unable to transmit data for that rider.
Should such a rider be in the race the score will be incorrect as they will be a "ghost" to this widget.

Happy to take pull requests to improve this - it is a mockup proof-of-concept to show the ladder and sauce integration.
