sauce4zwift Club Ladder Live Score
========

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
