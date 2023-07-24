sauce4zwift Club Ladder Live Score
========

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
