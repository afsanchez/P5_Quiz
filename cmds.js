
const Sequelize = require('sequelize');
const {models} = require('./model');
const{log, biglog, errorlog, colorize}= require("./out");

/**
*Muestra la ayuda
**/
exports.helpCmd = (socket, rl) => {
  		log(socket, " add : añadir un quiz al prgrama");
  		log(socket, " credits : devuelve el nombre de los autores de la practica");
  		log(socket, " list : listar todas las preguntas");
  		log(socket, " show <id> : Muestra la pregunta y la respuesta asociada a id");
  		log(socket, " delete <id> : Elimina la pregunta y la respuesta del quiz");
  		log(socket, " edit <id> : Edita la pregunta y/o la respuesta con el id indicado");
  		log(socket, " test <id> : Probar la pregunta con el id indicado");
  		log(socket, " play/p : Inicia el programa");
  		log(socket, " quit/q : Termina la ejecución del programa");
  		log(socket, " help/h : muestra la ayuda del programa");
  		rl.prompt();

};

const validateId = id => {
  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parametro <id>.`));
    } else {
      id = parseInt(id);  //coger la parte entera y descartar lo demas
      if(Number.isNaN(id)) {
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      } else {
        resolve(id);
      }
    }
  });
};


const makeQuestion = (rl, text) => {
  return new Sequelize.Promise((resolve, reject) => {
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};

/**
*Añadir nuevo quiz
**/

exports.addCmd = (socket, rl) => {
  makeQuestion(rl, 'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, 'Introduzca la respuesta: ')
    .then(a => {
      return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
  .then(quiz => {
    log(socket` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    error.log(socket, 'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
*Muestra los creditos y los autores de la practica
**/

exports.creditsCmd = (socket, rl) => {
    	log(socket, 'Autor de la practica:');
    	log(socket, 'ADRIAN Fernandez Sanchez');
    
    	rl.prompt();
};

/**
*Lista las pregunstas existentes 
**/

exports.listCmd = (socket, rl) => {
      models.quiz.findAll()
      .each(quiz=> {
          log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
      })
      
      .catch(error => {
        errorlog(socket, error.message);
      })
      .then(()=> {
        rl.prompt();
      });
};


/**
*Muestra el quiz indicado
**/

exports.showCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
*Borra un quiz que indiques
**/

exports.deleteCmd = (socket, rl, id) => {
      
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};
/**
*Edita un quiz
**/

exports.editCmd = (socket, rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket, `Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
  
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket, 'El quiz es erróneo');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(error => {
    rl.prompt();
  });
};

/**
*Prueba un quiz
**/

exports.testCmd = (socket, rl, id) =>{
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {

    if (!quiz){
      throw new Error(`No existe el quiz con id=${id}.`);
    }
  return makeQuestion(rl,colorize(quiz.question +'? ','red')
  )
  .then (respuesta => {
    if (respuesta.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
      log(socket, `Su respuesta es correcta.`);
      log(socket, `Correcta`);
    }else{
      log(socket, `Su respuesta es incorrecta.`);
      log(socket, `Incorrecta`);
    };
  });
  })
  .catch(Sequelize.ValidationError, error =>{
    errorlog(socket, 'El quiz no es correcto:');
    error.errors.forEach(({message}) => errorlog(socket, message));
  })
  .catch(error =>{
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.playCmd = (socket, rl )=> {
    let score = 0;
    let toBeResolved = [];
    
    
   const playOne = () => {

    return Promise.resolve()
    .then (() => {
      if (toBeResolved.length <= 0) {
        log(socket, "Fin del juego.");
        log(socket, "Ha obtenido " + score + " aciertos");
        return;
      }
      let aleatoriamente = Math.floor(Math.random()*(toBeResolved.length));
      let quiz = toBeResolved[aleatoriamente];
      toBeResolved.splice(aleatoriamente, 1);

      return makeQuestion(rl, quiz.question)
      .then(a => {
        if(a === quiz.answer) {
          score++;
          log(socket, "Su respusta es correcta");
          if (toBeResolved.length > 0){
          log(socket, "Lleva " + score + " aciertos");
          }   
          return playOne();

        } else {
          log(socket, "Su respusta es incorrecta");
          log(socket, "Fin del juego");
          log(socket, "Ha obtenido " + score + " aciertos");

        }
      })
    })
  }

  models.quiz.findAll({raw: true})
  .then(quizzes => {
    toBeResolved = quizzes;
  })
  .then(() => {
    return playOne();
  })
  .catch(er => {
    console.log("error: " + e);
  })
  .then(() => {
    console.log( score);
    rl.prompt();
  }) 
   
   
};

exports.quitCmd = (socket, rl) =>{
  rl.close();
  socket.end();
  rl.prompt();
 };