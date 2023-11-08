let settings = {
  roman: false,
  empty: false,
  gridSize: 4,
  solveSpeed: 4,
  allowUnsolveable: false,
}
let shuffling = false;
let solving = false;
let cancelAutoSolve = false;
let delay = remap(settings.solveSpeed, 1, 10, 20, 300);
async function swapDelay(){ await new Promise((t) => setTimeout(t, delay)); return; }
class Point{
  constructor(x, y){
    this.x = x;
    this.y = y;
  }
  toSingle(){ return (this.y * settings.gridSize) + this.x; }
  
  // Distance is calculated as Manhattan/Taxicab distance because we are in a grid of tiles
  distance(other){ return Math.abs(this.x - other.x) + Math.abs(this.y - other.y); }
}
class Cell {
  constructor(pos, blocked){
    this.pos = pos;
    this.blocked = blocked;
    this.neighbors = [];
    this.cost = 0;
  }
  getCost(from, to){
    this.cost = from.cost + this.pos.distance(to);
  }
}


// i could go for a mad nap right now
class Graph {
  constructor(){
    this.root = new Cell(new Point(0, 0), false, this);
    this.cells = [];
    this.cells.push(this.root);
  }
  resetWalls(){
    for(let i = 0; i < this.cells.length; i++){
      this.cells[i].blocked = false;
    }
  }
  addWalls(walls){
    for(let i = 0; i < this.cells.length; i++){
      for(let k = 0; k < walls.length; k++){
        if(pEqual(this.cells[i].pos, walls[k])){
          this.cells[i].blocked = true;
          break;
        }
      }
    }
  }
  setWalls(walls){
    this.resetWalls();
    for(let i = 0; i < this.cells.length; i++){
      for(let k = 0; k < walls.length; k++){
        if(pEqual(this.cells[i].pos, walls[k])){
          this.cells[i].blocked = true;
          break;
        }
      }
    }
  }
  pathfind(start, end){
    if(pEqual(start, end)){ return new Queue(); }
    for(let i = 0; i < this.cells.length; i++){
      this.cells[i].getCost(this.getCellAtPos(start), end);
    }
    let q = new Queue();
    let found = false;
    let fail = false;
    let cursor = new Point(start.x, start.y);
    q.push(cursor);
    while(!found && !fail){
      let current = this.getCellAtPos(cursor);
      let lowestCost = 1000;
      let lowest;
      for(let i = 0; i < current.neighbors.length; i++){
        if(current.neighbors[i].blocked){continue;}
        if(!q.contains(current.neighbors[i].pos) || q.length() < 2){
          current.neighbors[i].getCost(current, end);
          if(current.neighbors[i].cost < lowestCost){
            lowestCost = current.neighbors[i].cost;
            lowest = current.neighbors[i];
          }
        }
      }
      if(lowest === undefined){ fail = true; break; } // Uh Oh! Please dont happen
      cursor = new Point(lowest.pos.x, lowest.pos.y);
      q.push(cursor);
      if(pEqual(cursor, end)){
        fail = false;
        found = true;
      }
    }
    q.pop(); // the first in the queue is the start position so we can pop it before returning
    return q;
  }
  cellExistsAtPos(pos){
    for(let i = 0; i < this.cells.length; i++){
      if(pEqual(this.cells[i].pos, pos)){
        return true;
      }
    }
    return false;
  }
  getCellAtPos(pos){
    for(let i = 0; i < this.cells.length; i++){
      if(pEqual(this.cells[i].pos, pos)){
        return this.cells[i];
      }
    }
  }
  populate(){
    const permutation = [new Point(1, 0), new Point(-1, 0), new Point(0, 1), new Point(0, -1)];
    for(let i = 1; i < settings.gridSize * settings.gridSize; i++){
      this.cells.push(new Cell(singleToPoint(i), false));
    }
    for(let i = 0; i < this.cells.length; i++){
      for(let k = 0; k < permutation.length; k++){
        if(this.cellExistsAtPos(new Point(this.cells[i].pos.x + permutation[k].x, this.cells[i].pos.y + permutation[k].y))){
          this.cells[i].neighbors.push(this.getCellAtPos(new Point(this.cells[i].pos.x + permutation[k].x, this.cells[i].pos.y + permutation[k].y)));
        }
      }
    }
  }
}
class Queue {
  constructor(){
    this.backingStore = [];
  }
  push(e){ this.backingStore.push(e); }
  top(){ return this.backingStore[0]; }
  pop(){ 
    let temp = this.backingStore[0];
    this.backingStore.splice(0, 1);
    return temp;
  }
  contains(e){
    for(let i = 0; i < this.backingStore.length; i++){
      if(pEqual(this.backingStore[i], e)){
        return true;
      }
    }
    return false;
  }
  last() { 
    if(this.backingStore.length === 0){
      return {x: -1, y: -1};
    }
    return this.backingStore[this.backingStore.length - 1]; 
  }
  empty(){ return this.backingStore.length === 0; }
  length(){return this.backingStore.length;}
}


const cStr = "checked";
const eStr = "";
const positionsToSearch = [new Point(0, 1), new Point(0, -1), new Point(-1, 0), new Point(1, 0)];
const permutation = [new Point(1, 0), new Point(0, 1), new Point(-1, 0), new Point(0, -1)];
const grid = document.getElementById("grid");
let eIndex;
let tiles = [];
const settingsWrapper = document.getElementById("settingsPanelWrapper");
const settingsButton = document.getElementById("settingsWheel");
settingsButton.addEventListener("click", () => {
  // make settings panel
  if(settingsWrapper.className === "settingsPanel"){
    settingsWrapper.className = "";
    settingsWrapper.innerHTML = "";
    document.getElementById("gameContainer").style.filter = "";
  } else {
    settingsWrapper.className = "settingsPanel";
    document.getElementById("gameContainer").style.filter = "blur(4px)";
    // fill settings panel
    settingsWrapper.innerHTML = 
      `
        <div class="check">
          <input type="checkbox" id="romanCheckbox" ${(settings.roman ? cStr : eStr)}/>
          <label for="romanCheckbox">Show roman numerals</label>
        </div>
        <div class="check">
          <input type="checkbox" id="emptyCheckbox" ${(settings.empty ? cStr : eStr)}/>
          <label for="emptyCheckbox">Show empty tile</label>
        </div>
        <div class="num">
          <input type="radio" id="select15puzzle" name="size" ${(settings.gridSize === 4 ? cStr : eStr)}/>
          <label for="select15puzzle">15 Puzzle (4 x 4)</label>
          <input type="radio" id="select8puzzle" name="size" ${(settings.gridSize === 3 ? cStr : eStr)}/>
          <label for="select8puzzle">8 Puzzle (3 x 3)</label>
        </div>
        <div class="slider">
          <datalist id="speeds">
            <option value="1"></option>
            <option value="2"></option>
            <option value="3"></option>
            <option value="4"></option>
            <option value="5"></option>
            <option value="6"></option>
            <option value="7"></option>
            <option value="8"></option>
            <option value="9"></option>
            <option value="10"></option>
          </datalist>
          <input type="range" id="solveSpeed" name="speed" list="speeds" min="1" max="10" value="${settings.solveSpeed}"/>
          <label for="speed" id="speedLabel">Auto-solve delay between moves</label>
        </div>
        <div class="check">
          <input type="checkbox" id="unsolveableCheck" ${(settings.allowUnsolveable ? cStr : eStr)}/>
          <label for="unsolveableCheck">Allow unsolvable boards on shuffle</label>

        </div>

      `
      // Yeah, unsolvable is spelled wrong in a lot of the code.
      // I made sure it was spelled right anywhere it's actually displayed on the website
      // but im too lazy to fix it in the code.
      document.getElementById("romanCheckbox").addEventListener("click", () => {
        settings.roman = !settings.roman;
        const els = document.getElementsByTagName("p");  
        if(settings.roman){
          for(let i = 0; i < els.length; i++){
            if(els[i].parentElement.id !== "empty"){
              els[i].innerText = nToRoman(parseInt(els[i].innerText));
            }
          }
        } else {
          for(let i = 0; i < els.length; i++){
            if(els[i].parentElement.id !== "empty"){
              els[i].innerText = romanToN(els[i].innerText);
            }
          }        
        }
      });
      document.getElementById("emptyCheckbox").addEventListener("click", () => {
        settings.empty = !settings.empty;
        settings.empty ? verifyBoard() ? document.getElementById("empty").style.backgroundColor = "var(--solved)" : document.getElementById("empty").style.backgroundColor = `var(--fg)` : document.getElementById("empty").style.backgroundColor = `var(--bg)`;
      });
      document.getElementById("select15puzzle").addEventListener("click", () => {
        settings.gridSize = 4;
        abortSolve();
        makeTiles();
        shuffleBoard();
      });
      document.getElementById("select8puzzle").addEventListener("click", () => {
        settings.gridSize = 3;
        abortSolve();
        makeTiles();
        shuffleBoard();
      });
      document.getElementById("unsolveableCheck").addEventListener("click", (e) => {
        if(settings.allowUnsolveable){
          settings.allowUnsolveable = !settings.allowUnsolveable;
          shuffleBoard();
        } else {
          let conf = window.confirm("Enabling this option will disable auto-solve\nAre you sure?");
          if(conf){
            abortSolve();
            settings.allowUnsolveable = !settings.allowUnsolveable;  
            shuffleBoard();
          } else {
            e.preventDefault();
          }
        }
      });
      document.getElementById("solveSpeed").onchange = () => {
        settings.solveSpeed = document.getElementById("solveSpeed").value;
        delay = remap(settings.solveSpeed, 1, 10, 20, 300);
      };
  }
});
const infoWrapper = document.getElementById("infoPanelWrapper");
const infoButton = document.getElementById("infoButton");
let closeSettings = false;
settingsWrapper.onmouseleave = () => {
  closeSettings = true;
}
settingsWrapper.onmouseenter = () => {
  closeSettings = false;
}
let closeInfo = false;
infoWrapper.onmouseleave = () => {
  closeInfo = true;
}
infoWrapper.onmouseenter = () => {
  closeInfo = false;
}
document.onclick = () => {
  if(closeSettings){
    settingsWrapper.className = "";
    settingsWrapper.innerHTML = "";
    document.getElementById("gameContainer").style.filter = "";
    closeSettings = false;
  }
  if(closeInfo){
    infoWrapper.className = "";
    infoWrapper.innerHTML = "";
    document.getElementById("gameContainer").style.filter = "";
    closeInfo = false;
  }
}
function getRandomIconName(){
  icons = [
    "warning", 
    "elderly_woman", 
    "vaping_rooms", 
    "heart_broken", 
    "sentiment_dissatisfied", 
    "mood_bad",
    "sick",
    "skull",
    "flood",
    "sentiment_frustrated",
    "sentiment_sad",
    "auto_towing",
    "sports_kabaddi",
  ]
  return icons[Math.floor(Math.random() * icons.length)];
}
infoButton.addEventListener("click", () => {
  if(infoWrapper.className === "infoPanel"){
    infoWrapper.className = "";
    infoWrapper.innerHTML = "";
    document.getElementById("gameContainer").style.filter = "";
  } else {
    infoWrapper.className = "infoPanel";
    document.getElementById("gameContainer").style.filter = "blur(4px)";
    infoWrapper.innerHTML = 
    `
        <h3>
          Made with <span class="material-symbols-outlined" id="randomIcon">${getRandomIconName()}</span> by Connor
        </h3>
        <a href="https://github.com/sm3232">
          <img src="github-logo.png"/>
        </a>

    `
  }

});


// Tile offset from it's solved position
function getTileOffset(tile){
  const numAsPos = singleToPoint(tile.num - 1);
  return new Point(-(tile.pos.x - numAsPos.x), tile.pos.y - numAsPos.y);
}
// Are two points equal?
// Can you define operators for classes in js? what is the correct way to do this?
function pEqual(p1, p2){
  if(p1.x === p2.x && p1.y === p2.y){
    return true;
  }
  return false;
}
function remap(val, inMin, inMax, outMin, outMax){
  return outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin);
}
function getIndexOfTileAtPos(pos){
  for(let i = 0; i < tiles.length; i++){
    if(tiles[i].pos.x === pos.x && tiles[i].pos.y === pos.y){
      return i;
    }
  }
}
// dont think i can define multiple constructors for Point? 
function singleToPoint(single){ return new Point(single % settings.gridSize, Math.floor(single / settings.gridSize)); }

async function moveEmptyAlongPath(path){
  while(!path.empty()){
    if(cancelAutoSolve){ return; }
    r = await swapTiles(tiles[eIndex], tiles[getIndexOfTileAtPos(path.pop())]);
  }
  return;
}
async function moveTile(index, pos, g, locked){
  while(!pEqual(tiles[index].pos, pos)){
    if(cancelAutoSolve){ return; }
    g.setWalls(locked);
    let master = g.pathfind(tiles[index].pos, pos);
    g.addWalls([tiles[index].pos]);
    let path = g.pathfind(tiles[eIndex].pos, master.top());
    let r = await moveEmptyAlongPath(path);
    r = await swapTiles(tiles[index], tiles[eIndex]);
  }
  return;
}
async function moveEmpty(pos, g, locked){
  if(cancelAutoSolve){ return; }
  g.setWalls(locked);
  let path = g.pathfind(tiles[eIndex].pos, pos);
  const r = await moveEmptyAlongPath(path);
  return;
}
async function solveRowOne(g, locked){
  let r;
  r = await moveTile(0, new Point(0, 0), g, locked);
  locked.push(tiles[0].pos);
  r = await moveTile(1, new Point(1, 0), g, locked);
  locked.push(tiles[1].pos);
  if(tiles[2].pos.x > 1 && tiles[2].pos.y < 2 && !pEqual(tiles[3].pos, new Point(2, 0))){
    r = await moveTile(2, new Point(1, 1), g, locked);
  }
  r = await moveTile(3, new Point(2, 0), g, locked);
  locked.push(tiles[3].pos);
  r = await moveTile(2, new Point(2, 1), g, locked);
  locked.push(tiles[2].pos);
  r = await moveEmpty(new Point(3, 0), g, locked);
  r = await swapTiles(tiles[3], tiles[eIndex]);
  r = await swapTiles(tiles[2], tiles[eIndex]);
  locked[3] = tiles[3].pos;
}
async function solveRowTwo(g, locked){
  let r;
  r = await moveTile(4, new Point(0, 1), g, locked);
  locked.push(tiles[4].pos);
  r = await moveTile(5, new Point(1, 1), g, locked);
  locked.push(tiles[5].pos);
  if(tiles[6].pos.x > 1 && tiles[6].pos.y !== 3 && !pEqual(tiles[7].pos, new Point(2, 1))){
    r = await moveTile(6, new Point(1, 2), g, locked);
  }
  r = await moveTile(7, new Point(2, 1), g, locked);
  locked.push(tiles[7].pos);
  r = await moveTile(6, new Point(2, 2), g, locked);
  locked.push(tiles[6].pos);
  r = await moveEmpty(new Point(3, 1), g, locked);
  r = await swapTiles(tiles[7], tiles[eIndex]);
  r = await swapTiles(tiles[6], tiles[eIndex]);
  locked[7] = tiles[7].pos;
}
async function solveRowThree(g, locked){
  let r;
  r = await moveTile(8, new Point(3, 3), g, locked);
  r = await moveTile(12, new Point(0, 2), g, locked);
  locked.push(tiles[12].pos);
  r = await moveTile(8, new Point(1, 2), g, locked);
  locked.push(tiles[8].pos);
  r = await moveEmpty(new Point(0, 3), g, locked);
  r = await swapTiles(tiles[12], tiles[eIndex]);
  r = await swapTiles(tiles[8], tiles[eIndex]);
  locked[9] = tiles[12].pos;
  r = await moveTile(9, new Point(3, 3), g, locked);
  r = await moveTile(13, new Point(1, 2), g, locked);
  locked.push(tiles[13].pos);
  r = await moveTile(9, new Point(2, 2), g, locked);
  locked.push(tiles[9].pos);
  r = await moveEmpty(new Point(1, 3), g, locked);
  r = await swapTiles(tiles[13], tiles[eIndex]);
  r = await swapTiles(tiles[9], tiles[eIndex]);
  locked[11] = tiles[13].pos;
}
async function abortSolve(){
  if(cancelAutoSolve) { return; }
  cancelAutoSolve = true;
  while(solving){
    let r = await swapDelay();
  }
  finalizeSolve();
  return;
}
async function waitForShuffle(){
  while(shuffling){
    let r = await swapDelay();
  }
  return;
}
function finalizeSolve(){
  cancelAutoSolve = false;
  solving = false;
}

  /*
  * This algorithm does not attempt to find the fastest solution, it just tries to 
  * solve the damn thing
  * It does take some things into consideration, like it wont attempt to re-solve
  * already correct tiles, and it wont move tiles 3/7/9 if they arent actually going to be in the 
  * way of the solution.
  * Full description:
  *
  *   - Make a Graph and populate it with all the cells in the game grid 
  *     - More details in comments around Graph definition near the top of this file 
  *   - Split into two cases (4x4 grid or 3x3 grid)
  *     - I'm just going to be explaining the 4x4 case, because the 3x3 case 
  *       is the same with just some position/index differences
  *     - The solution to both cases is pretty similar, and they could probably be condensed into one case 
  *       with slight changes to the row functions
  *   - Solve row one: 
  *     - Put tiles 1 and 2 into their final positions 
  *     - Move tile 3 away from the top right corner so it doesn't get stuck
  *     - Put tile 4 into tile 3's final position, and then move tile 3 directly under tile 4
  *     - Move the empty tile into the top right corner without touching tiles 3 and 4
  *     - Move tile 4 into it's final position, then tile 3 into it's final position 
  *   - Solving row two is the exact same as row one 
  *   - Rows three and four need to be solved concurrently 
  *     - Move tile 9 away from the left so it doesnt get stuck 
  *     - Move tile 13 into tile 9's final position 
  *     - Move tile 9 into tile 10's final position 
  *     - Move the empty tile into the bottom left corner
  *     - Move tile 13 into it's final position, then tile 9 into it's final position 
  *     - Repeat the above steps for tiles 10 and 14
  *     - Rotate the last 3 tiles clockwise until the board is solved
  *     - Pray
  */

const solveButton = document.getElementById("solveButton");
solveButton.addEventListener("click", async () => {
  if(settings.allowUnsolveable){ return; }
  let r;
  if(solving) { abortSolve(); return; }
  if(shuffling) { r = await waitForShuffle();}
  solving = true;
  updateTiles(tiles, eIndex);
  let g = new Graph();
  g.populate();
  let locked = [];
  if(settings.gridSize === 4){
    // The only reason I split each row into it's own function is for organization
    if(!cancelAutoSolve && (!tiles[0].solved || !tiles[1].solved || !tiles[2].solved || !tiles[3].solved)){
      r = await solveRowOne(g, locked);
    }
    if(!cancelAutoSolve && (!tiles[4].solved || !tiles[5].solved || !tiles[6].solved || !tiles[7].solved)){
      r = await solveRowTwo(g, locked);
    }
    if(!cancelAutoSolve && (!tiles[8].solved || !tiles[9].solved || !tiles[12].solved || !tiles[13].solved)){
      r = await solveRowThree(g, locked);
    }
  } else {
    if(!cancelAutoSolve && (!tiles[0].solved || !tiles[1].solved || !tiles[2].solved)){
      r = await moveTile(0, new Point(0, 0), g, locked);
      locked.push(new Point(0, 0));
      r = await moveTile(1, new Point(0, 2), g, locked);
      r = await moveTile(2, new Point(1, 0), g, locked);
      locked.push(new Point(1, 0));
      r = await moveTile(1, new Point(1, 1), g, locked);
      locked.push(new Point(1, 1));
      r = await moveEmpty(new Point(2, 0), g, locked);
      r = await swapTiles(tiles[2], tiles[eIndex]);
      r = await swapTiles(tiles[1], tiles[eIndex]);
      locked[2] = new Point(2, 0);
    }
    if(!cancelAutoSolve && (!tiles[3].solved || !tiles[6].solved)){
      r = await moveTile(3, new Point(2, 2), g, locked);
      r = await moveTile(6, new Point(0, 1), g, locked);
      locked.push(new Point(0, 1));
      r = await moveTile(3, new Point(1, 1), g, locked);
      locked.push(new Point(1, 1));
      r = await moveEmpty(new Point(0, 2), g, locked);
      r = await swapTiles(tiles[6], tiles[eIndex]);
      r = await swapTiles(tiles[3], tiles[eIndex]);
      locked[4] = new Point(0, 2);
    }
  }
  // This last block of code is for the last 3 tiles (the "rotate clockwise" step of solving)
  if(!cancelAutoSolve){
    r = await moveEmpty(new Point(settings.gridSize - 2, settings.gridSize - 2), g, locked);
    let i = 0;
    while(!verifyBoard() && !cancelAutoSolve){
      let p = new Point(tiles[eIndex].pos.x + permutation[i].x, tiles[eIndex].pos.y + permutation[i].y);
      r = await swapTiles(tiles[getIndexOfTileAtPos(p)], tiles[eIndex]);
      i + 1 >= permutation.length ? i = 0 : i++;
    }
  }
  finalizeSolve();
});

function verifyBoard(){
  for(let i = 0; i < tiles.length; i++){
    if(!pEqual(singleToPoint(tiles[i].num - 1), tiles[i].pos)){
      for(let i = 0; i < tiles.length; i++){
        if(!settings.empty){
          if(tiles[i].element.id !== "empty"){
            tiles[i].element.style.backgroundColor = "var(--fg)";
          }
        } else {
          tiles[i].element.style.backgroundColor = "var(--fg)";
        }
      }   
      return false;
    }
  }
  for(let i = 0; i < tiles.length; i++){
    if(!settings.empty){
      if(tiles[i].element.id !== "empty"){
        tiles[i].element.style.backgroundColor = "var(--solved)";
      }
    } else {
        tiles[i].element.style.backgroundColor = "var(--solved)";
    }
  }
  return true;
}
function getTransformFromStyle(str){
  if(str === ""){
    return {x: 0, y: 0};
  }
  str = str.substring(10);
  let i = 0;
  while(str[i] !== 'p'){
    i++;
  }
  const val1 = parseFloat(str.substring(0, i));
  let val2 = 0;
  let j = i + 2;
  if(str[j] !== ')'){
    while(str[j] !== 'p'){
      j++;
    }
    val2 = parseFloat(str.substring(i + 4, j));

  }
  return {x: val1, y: val2};
}
async function swapTiles(t1, t2){
  if(cancelAutoSolve){ return; }
  const elemWidth = t1.element.getBoundingClientRect().right - t1.element.getBoundingClientRect().left + (grid.style.gap.substring(0, 2) * 1);
  const oldPos = t1.pos;
  t1.pos = t2.pos;
  t2.pos = oldPos;
            
  const currentTileTransform = getTransformFromStyle(t1.element.style.transform);
  const offset = {
    x: t2.pos.x - t1.pos.x,
    y: t2.pos.y - t1.pos.y
  };
  t1.element.style.transform = `translate(${(-offset.x * elemWidth) + currentTileTransform.x}px, ${(-offset.y * elemWidth) + currentTileTransform.y}px)`;
  const currentEmptyTransform = getTransformFromStyle(t2.element.style.transform);
  t2.element.style.transform = `translate(${(offset.x * elemWidth) + currentEmptyTransform.x}px, ${(offset.y * elemWidth) + currentEmptyTransform.y}px)`;
  updateTiles(tiles, eIndex);
  let r = await swapDelay();
}

  /*
  * Rules for solvability:
  * "width" is either 3 or 4 (the 8-puzzle and 15-puzzle)
  * if the width is odd, then any board is solvable as long as the inversion count is even 
  * if the width is even, then any board is solvable as long as it meets one of two criteria:
  *   1. the empty tile is on an odd row and the inversion count is odd
  *   2. the empty tile is on an even row and the inversion count is even 
  * 
  * What the hell is an inversion count?
  *   the number of inversions is the count of pairs of elements (a, b) such that a < b and f(a) > f(b)
  *
  *   What the hell are a, b, f(a), and f(b)?
  *     a and b are the number associated with any two tiles in the grid (NOT including the empty tile!!!)
  *       i.e. a 3x3 grid contains 1-8, so an (a, b) pair could be (2, 4) or (8, 1) or (6, 5) etc...
  *         for clarity: a and b are always different tiles from each other. a != b.
  *         because we are only counting pairs such that a < b, the pairs (8, 1) and (6, 5) wouldn't be considered
  *
  *     f(a) and f(b) are the position that a and b appear in 
  *   
  *   it will probably make the most sense with an example:
  *
  *     | 3 | 1 | 7 |
  *     | 4 | 5 | 8 |
  *     | 2 | 6 |   |
  *
  *     this grid has 10 inversions: (a, b) = (3, 1), (4, 7), (5, 7), (2, 3), (2, 7), (2, 4), (2, 5), (2, 8), (6, 7), (6, 8)
  *     this grid flattened to 1 dimension would be: 31745826
  *     an example of a and b for this grid is (4, 7). So the tile in the middle left position and the tile in the top right position 
  *     a and b could also be (3, 5), or any other two tiles such that a < b.
  *     using (a, b) := (4, 7) as an example for f(a) and f(b), f(a) = 4 and f(b) = 3 
  *       because "a" is the 4th number in the 1D version and "b" is the 3rd number in the 1D version  
  *
  */ 
function solvable(){
  let tar = [];
  tar.length = tiles.length;
  for(let i = 0; i < tiles.length; i++){
    if(i !== eIndex){
      tar[tiles[i].pos.toSingle()] = tiles[i].num;
    }
  }
  let inversions = 0;
  for(let i = 0; i < tar.length - 1; i++){
    for(let k = i + 1; k < tar.length; k++){
      if(tar[i] > tar[k]){
        inversions++;
      }
    }
  }
  if(settings.gridSize % 2 === 1){
    if(inversions % 2 === 0){
      return true;
    } else {
      return false;
    }
  } else {
    if(inversions % 2 === 0){
      if(tiles[eIndex].pos.y % 2 === 1){
        return true;
      } else {
        return false;
      }
    } else {
      if(tiles[eIndex].pos.y % 2 === 0){
        return true;
      } else {
        return false;
      }
    }
  }
}
async function shuffleBoard(){
  async function shuffle(times){
    for(let i = 0; i < times; i++){
      let rand1 = Math.floor(Math.random() * tiles.length);
      let rand2 = Math.floor(Math.random() * tiles.length);
      while(rand1 === rand2){
        rand2 = Math.floor(Math.random() * tiles.length);
      }
      swapTiles(tiles[rand1], tiles[rand2]);
      updateTiles(tiles, eIndex);
      verifyBoard();
      await new Promise((t) => setTimeout(t, 5));

    }
    updateTiles(tiles, eIndex);
  }
  shuffling = true;
  let r;
  if(solving) { r = await abortSolve(); }
  r = await shuffle(25);
  if(!settings.allowUnsolveable){
    document.getElementById("warning").className = "invis";
    while(!solvable()){
      r = await shuffle(1);
    }
  } else {
    if(!solvable()){
      document.getElementById("warning").className = "";
    } else {
      document.getElementById("warning").className = "invis";
    }
  }
  shuffling = false;
}
function updateTiles(tileArray, emptyIndex){
  for(let i = 0; i < tileArray.length; i++){
    tileArray[i].offset = getTileOffset(tileArray[i]);
    let set = false;
    for(let k = 0; k < positionsToSearch.length; k++){
      if(tileArray[i].pos.x + positionsToSearch[k].x === tileArray[emptyIndex].pos.x && tileArray[i].pos.y + positionsToSearch[k].y === tileArray[emptyIndex].pos.y){
        tileArray[i].moveable = true;
        set = true;
      }
    }
    tileArray[i].relationToEmpty = new Point(-(tileArray[i].pos.x - tileArray[emptyIndex].pos.x), tileArray[i].pos.y - tileArray[emptyIndex].pos.y);
    if(!set){
      tileArray[i].moveable = false;
    }
    if(tileArray[i].offset.x === 0 && tileArray[i].offset.y === 0){
      tileArray[i].solved = true;
    } else {
      tileArray[i].solved = false;
    }
  }
  
}
function nToRoman(n){
  const romans = {
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  const letters = ["C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let str = "";
  for(let i = 0; i < 9; i++){
    while(n >= romans[letters[i]]){
      n -= romans[letters[i]];
      str += letters[i];
    }
  } 
  return str;
}
function romanToN(r){
  const romans = {
    C: 100,
    L: 50,
    X: 10,
    V: 5,
    I: 1,
  }
  let n = 0;
  n += romans[r[r.length - 1]];
  for(let i = r.length - 2; i >= 0; i--){
    romans[r[i]] < romans[r[i + 1]] ? n -= romans[r[i]] : n += romans[r[i]];
  }
  return n;
}
function generateGrid(gridSize){
  let inner = "";
  for(let i = 1; i < gridSize; i++){
    inner += `<div class=\"gridItem\" id=\"tile-${i}\"><p>${(settings.roman ? nToRoman(i) : i)}</p></div>`;
  }
  inner += `<div class=\"gridItem\" id=\"empty\"><p> </p></div>`;
  grid.innerHTML = inner;
  settings.empty ? document.getElementById("empty").style.backgroundColor = `var(--fg)` : document.getElementById("empty").style.backgroundColor = `var(--bg)`;
  grid.style.gap = "10px";
  grid.style.gridTemplateColumns = `repeat(${settings.gridSize}, 1fr)`;
}
function makeTiles(){

  generateGrid(settings.gridSize * settings.gridSize);
  tiles = [];
  const tileElements = document.getElementsByClassName("gridItem");


  let cursor = new Point(0, 0); 
  for(let i = 0; i < tileElements.length; i++){
    tiles.push(
      {
        element: tileElements[i], 
        pos: cursor, 
        num: i + 1, 
        offset: new Point(0, 0), 
        moveable: false, 
        relationToEmpty: new Point(0, 0),
        solved: false,
      });
    tileElements[i].style.transform = "";
    tileElements[i].style.transition = "0.2s";
    if(cursor.x + 1 < settings.gridSize){
      cursor = new Point(cursor.x + 1, cursor.y);
    } else {
      cursor = new Point(0, cursor.y + 1);
    }
    tiles[i].element.onmousedown = () => {
      updateTiles(tiles, eIndex);
      if(tiles[i].moveable){
        swapTiles(tiles[i], tiles[eIndex]);
      }
      verifyBoard();
    }
  }
  eIndex = tiles.length - 1;
  updateTiles(tiles, eIndex);
  verifyBoard();
}

/*
 * If I don't do this on resize the tiles get all messed up. The reason is because of how I deal with moving tiles 
 * around on the board (transform in css)
 */
window.addEventListener("resize", () => {
  makeTiles();
  if(!shuffling){
    shuffleBoard();
  }
});
const shuffleButton = document.getElementById("shuffleButton");
shuffleButton.addEventListener("click", () => {
  if(!shuffling){
    shuffleBoard();
  }
});
makeTiles();
shuffleBoard(); 
