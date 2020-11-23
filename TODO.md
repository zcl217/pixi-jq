
TO DO

use a grid system for collision detection (split entities into squares of a grid, loop through
each entity in a square to see if something has collided)
if collision with platform, vy = 0;
if collision with bullet, back to start

if collide, compare x and y coordinates to check which side we collided on:
if collided with top or bottom, vy = 0
if collided with left or right, vx = 0
(if collide with left or right, state = falling perhaps? where we can't control the character)



just mod the x and y positions with the grid size
ex. you're in position x 300 y 300 mod 300 = x 3 y 3. to find grid, grid[3][3]

16 17 18
11 12 13 14 15
6 7 8 9 10
1 2 3 4 5


roadmap:
finish all menu scenes
    - set up stage menu
    - tidy up char creation menu
    - set up multiplayer menu
finish jump quest stuff
    - flinching/obstacle sprites
    - entity grid for platforms and sprites? (for sprites they move so..
    actually it'll be ok cuz they move within a limited range.
    just set it up so they aren't in more than two grids at once)
implement websocket

fiX: jumping through the wall sprite

optional:
implement down jump

