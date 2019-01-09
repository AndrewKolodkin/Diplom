'use strict';
class Vector {
	constructor(x = 0, y = 0){
		this.x = x;
		this.y = y;
	}

	plus(obj) {
		if (!(obj instanceof Vector)) {
			throw new Error('Можно прибавлять к вектору только вектор типа Vector');
		}
		return new Vector(this.x + obj.x, this.y + obj.y);
	}

	times(num) {
		return new Vector(this.x * num, this.y * num);
	}
}

class Actor {
	constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)){
		if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
			throw new Error('Можно использовать, только вектор типа Vector');
		}

		this.pos = pos;
		this.size = size;
		this.speed = speed;
		}

	act(){}
		
	isIntersect(obj) {
		if (!(obj instanceof Actor)){
			throw new Error('Можно использовать, только аргумент типа Vector');
		}
		if (this === obj) {
			return false;
		} 
		
		return this.right > obj.left && 
           this.left < obj.right && 
           this.top < obj.bottom && 
           this.bottom > obj.top;
	}

	get type(){
		return 'actor';
	}

	get left(){
		return this.pos.x;
	}

	get top(){
		return this.pos.y;
	}

	get right(){
		return this.pos.x + this.size.x;
	}

	get bottom(){
		return this.pos.y + this.size.y;
	}
}

class Level {
	constructor(grid = [], actor = []){
		this.grid = grid;
		this.actors = actor;
		this.player = this.actors.find(function(actor) {
			return actor.type === 'player';
		});
		this.height = grid.length;
		this.width = grid.reduce(function (s, el) {
      if (el.length  > s) {
        return el.length
      } else {
        return s;
      }
    }, 0);
		this.status = null;
		this.finishDelay = 1;
	}

	isFinished(){
		return this.status !== null && this.finishDelay < 0;
	}

	actorAt(obj){
		if (!(obj instanceof Actor)){
			throw new Error('Можно использовать, только аргумент типа Actor');
		}
		return this.actors.find(function(el){
            if (obj.isIntersect(el)) { 
              return el;
            }
          });
	}

	obstacleAt(pos, size){
		if (!(pos instanceof Vector) || !(size instanceof Vector)) {
			throw new Error('Можно использовать, только вектор типа Vector');
		}
		let posL = Math.floor(pos.x);
		let posT = Math.floor(pos.y);
		let posR = Math.ceil(pos.x + size.x);
		let posB = Math.ceil(pos.y + size.y);
		if (posL < 0 || posT < 0 || posR > this.width) {
      return 'wall';
    }
		if (posB > this.height) {
      return 'lava';
    }
		for (let i = posT; i < posB; i++) {
			for (let j = posL; j < posR; j++){
				if (this.grid[i][j]) {return this.grid[i][j];}
			}
		}
	}

	removeActor(obj){
		let index = this.actors.indexOf(obj);
		if (index >= 0) {
      this.actors.splice(index, 1);
    }
	}

	noMoreActors(str){
		return !this.actors.some(function(actor){return actor.type === str;})	
	}

	playerTouched(str, obj){
		if (this.status !== null) {
			return;
		}
		if (str === 'lava' || str === 'fireball') {
			this.status = 'lost';
		} else if (str === 'coin') {
			this.removeActor(obj);
			if (this.noMoreActors(str)) {
				this.status = 'won';
			}
		}
	}
}

class Player extends Actor {
	 constructor(obj = new Vector(0, 0)) {
	 	super(obj);
	 	this.pos = obj.plus(new Vector(0, -0.5));
		this.size = new Vector(0.8, 1.5);
		this.speed = new Vector(0, 0);
	 }

	 get type(){
	 	return 'player';
	 }
}

class LevelParser {
	constructor(obj){
		this.dictionary = obj;
	}

	actorFromSymbol(str = undefined){
		if (str === undefined) {
      return undefined;
    }
		for (let key in this.dictionary) {
			if (key === str) {
				return this.dictionary[str];
			}
		}
	}

	obstacleFromSymbol(str){
		if (str === 'x') {
      return 'wall';
    } else if (str === '!') {
      return 'lava';
    }
	}

	createGrid(arr){
		let obstacleArr = [];
		for(let obstacle of arr){
			let obstacleSym = obstacle.split('');
			let arr = [];
			arr = obstacleSym.map(function(el){
				return LevelParser.prototype.obstacleFromSymbol(el);
			});
			obstacleArr.push(arr);
		}
		return obstacleArr;
	}

	createActors(arr){
		let actorArr = [];
		let y = 0, x = 0;
		for(let actor of arr){
			x = 0;
			let actorSym = actor.split('');
			for(let sym of actorSym){
				if (this.actorFromSymbol(sym) !== undefined && ((typeof this.actorFromSymbol(sym)) === 'function')) {
					let Constructor = this.actorFromSymbol(sym);
					let newConstr = new Constructor(new Vector(x, y));
					if (newConstr instanceof Actor) {
						actorArr.push(new Constructor(new Vector(x, y)));
					}
				}
				x++;
			}
			y++;
		}
		return actorArr;
	}

	parse(arr){
		return new Level(this.createGrid(arr), this.createActors(arr));
	}
}

class Fireball extends Actor{
	constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)){
		super(pos, new Vector(1, 1), speed);
		this.act = function(time, obj){
			let size = this.size;
		  let nextPosition = this.getNextPosition(time);
		  let actIn = obj.obstacleAt(nextPosition, size);
		  if (actIn === undefined) {
			  this.pos = nextPosition;
		  } else {
			  this.handleObstacle();
		  }
		};
	}

	get type(){
		return 'fireball';
	}

	getNextPosition(time = 1){
		return this.pos.plus(this.speed.times(time));
	}

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
	
}

class HorizontalFireball extends Fireball{
	constructor(pos){
		super(pos);
		this.size = new Vector(1, 1);
		this.speed = new Vector(2, 0);
	} 
}

class VerticalFireball extends Fireball{
	constructor(pos){
		super(pos);
		this.size = new Vector(1, 1);
		this.speed = new Vector(0, 2);
	}
}

class FireRain extends Fireball{
	constructor(pos){
		super(pos);
		this.size = new Vector(1, 1);
		this.speed = new Vector(0, 3);
		this.handleObstacle = function(){this.pos = pos;}
	}
}

class Coin extends Actor{
	constructor(pos = new Vector(0, 0)){
		super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
		this.springSpeed = 8;
		this.springDist = 0.07;
		this.spring = Math.random() * 2 * Math.PI;
		this.startPos = this.pos;
		
	}

	get type(){
		return 'coin';
	}

	updateSpring(time = 1){
		this.spring += this.springSpeed * time;
	}

	getSpringVector(){
		return new Vector(0, Math.sin(this.spring) * this.springDist);
	}

	getNextPosition(time = 1){
		this.updateSpring(time);
		return this.startPos.plus(this.getSpringVector());
	}
  
	act(time) {
    this.pos = this.getNextPosition(time);
  }
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball

};

const parser = new LevelParser(actorDict);

loadLevels()
  .then((res) => {
    runGame(JSON.parse(res), parser, DOMDisplay)
      .then(() => alert('Вы выиграли!'))
  });
