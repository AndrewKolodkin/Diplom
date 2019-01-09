'use strict';
class Vector {
	constructor(x = 0,y = 0) {
		this.x = x;
		this.y = y;
	}

	plus(objVector) {
		if (!(objVector instanceof Vector)) {
			throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
		}

		return new Vector(this.x + objVector.x, this.y + objVector.y);
	}

 	times(count) {
 	  return new Vector(this.x * count, this.y * count);
 	}
}


class Actor {
  constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
    this.pos = pos;
    this.size = size;
    this.speed = speed;

    if(!(this.pos instanceof Vector)) {
      throw new Error('Расположением может быть только объект типа Vector');
    }
		if(!(this.size instanceof Vector)) {
      throw new Error('Размером может быть только объект типа Vector');
    }
		if(!(this.speed instanceof Vector )) {
      throw new Error('Скоростью может быть только объект типа Vector');
    }
  }

  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }


  act() {}

  get type() {
    return 'actor';
  }

  isIntersect(objActor) {
    if (!(objActor instanceof Actor)) {
      throw new Error(' Обязательный аргумент — только движущийся объект типа Actor');
    }

    if(objActor === this) {
      return false;
    }

    if (this.top >= objActor.bottom) return false;
    if (this.bottom <= objActor.top) return false;
		if (this.right <= objActor.left) return false;
		if (this.left >= objActor.right) return false;

    return true;
  }
}



class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
		this.player = this.actors.find(function(actor) {
      return actor.type == "player";
    });
    this.status = null;
    this.finishDelay = 1;
    this.height = this.grid.length;
    this.width = this.height > 0 ? Math.max.apply(Math, this.grid.map(function(el) {
      return el.length;
    })) : 0;
  }

  // get width() {
  //   var arrayOfX = [];

  //   for (var array of this.grid) {
  //     arrayOfX.push(array.length);
  //     }

  //   return Math.max.apply(null, arrayOfX);
  // }

  isFinished() {
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  }

	/*

Возвращает undefined, если переданный движущийся объект
не пересекается ни с одним объектом на игровом поле.

Возвращает объект Actor, если переданный объект пересекается с ним
на игровом поле. Если пересекается с несколькими объектами,
вернет первый.

*/
  actorAt(objActor) {
    if (!(objActor instanceof Actor)) {
      throw new Error(' Обязательный аргумент — только движущийся объект типа Actor');
    }
  for (let actor of this.actors) {
			if (actor.isIntersect(objActor))
			return actor;
		}
		return undefined;
  }

  obstacleAt(pos, size) {
    if(!(pos instanceof Vector && size instanceof Vector)) {
      throw new Error('Можно использовать только объект типа Vector');
    }

    let xStart = Math.floor(pos.x);
    let xEnd = Math.ceil(pos.x + size.x);
    let yStart = Math.floor(pos.y);
    let yEnd = Math.ceil(pos.y + size.y);

    if(xStart < 0 || xEnd > this.width || yStart < 0) {
      return 'wall';
    }

    if(yEnd > this.height) {
      return 'lava';
    }

    for (var x = xStart; x < xEnd; x++) {
      for (var y = yStart; y < yEnd; y++) {
        var obstacle = this.grid[x][y];
          if (obstacle) {
            return obstacle;
        } else {
          return undefined;
        }
      }
    }
  }

  removeActor(objActor) {
    for (var i = 0; i < this.actors.length; i++) {
      if(this.actors[i] === objActor) {
        this.actors.splice(i, 1); // начиная с совпавщего индекса, удалить 1 элемент
      }
    }
  }



  /*

Принимает один аргумент — тип движущегося объекта, строка.
Возвращает true, если на игровом поле нет объектов этого типа
(свойство type). Иначе возвращает false.
  */

  noMoreActors(typeOfActor) {
    return !(this.actors.some(actor => actor.type === typeOfActor));
  }

/*
Если первым аргументом передать строку coin, а вторым — объект монеты, то необходимо
удалить эту монету с игрового поля. Если при этом на игровом поле не осталось больше монет
,то меняем статус игры на won. Игрок побеждает, когда собирает все монеты на уровне.
Отсюда вытекает факт, что уровень без монет пройти невозможно.   */



  playerTouched(typeString, actorTouch) {
    if(this.status !== null) { }

    if (typeString === 'lava' || typeString === 'fireball') {
      this.status = 'lost';
    }

    if(typeString === 'coin') {
      this.removeActor(actorTouch);
      if(this.noMoreActors('coin')) {
				this.status = 'won';
				this.finishDelay = 1;
			}
    }
  }

}


class LevelParser  {
	constructor(dictionary) {
		this.dictionary = dictionary; // словарь символов (движущихся объектов)
	}

	actorFromSymbol(symbol) {
		if (symbol === undefined) {
			return undefined;
		}
		if (Object.keys(this.dictionary).indexOf(symbol) !== -1) {
			return this.dictionary[symbol];
		}
		return undefined;
	}

	obstacleFromSymbol(symbol) {
		if(symbol === 'x') {
			return 'wall';
		} else if(symbol === '!') {
			return 'lava';
		} else {
			return undefined;
		}
	}

	createGrid(plan) {
    let arrays = [];
    if (plan.length == 0) {
      return arrays;
    } else {
      arrays = plan.map(string => string.split(''));
    }
    for (let i = 0; i < arrays.length; i++) {
      arrays[i] = arrays[i].map(el => this.obstacleFromSymbol(el));
    }
    return arrays;
  }

	createActors(plan) {
         let arrayActors = [], counter = 0;
         for (var i = 0; i < plan.length; i++) {
             for (var j = 0; j < plan[i].length; j++) {
                 if ((this.actorFromSymbol(plan[i][j])) && (!this.obstacleFromSymbol(plan[i][j])) && (typeof (this.actorFromSymbol(plan[i][j])) == 'function')) {
                     var funcCreate = this.actorFromSymbol(plan[i][j]);
                     var objCreate = new funcCreate(new Vector(j, i));
                     if(Actor.prototype.isPrototypeOf(objCreate)) {
                         arrayActors[counter] = objCreate;
                         counter++;
                     }
                 }
             }
         }

         return arrayActors;
     }

	parse(plan) {
		return new Level(this.createGrid(plan), this.createActors(plan));
	}

}


const plan = [
  ' @ ',
  'x!x'
];

const actorsDict = Object.create(null);
actorsDict['@'] = Actor;

const parser = new LevelParser(actorsDict);
const level = parser.parse(plan);

level.grid.forEach((line, y) => {
  line.forEach((cell, x) => console.log(`(${x}:${y}) ${cell}`));
});

level.actors.forEach(actor => console.log(`(${actor.pos.x}:${actor.pos.y}) ${actor.type}`));
