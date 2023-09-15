const fs = require('fs');
const listFileName = './movieList.json';
const newFileName = './movieListNew.json';

let list;
let newList = {};

fs.readFile(listFileName, 'utf8', (err, data) => {
  try {
    list = JSON.parse(data);
  }
  catch (err) {
    list = [];
  }

  for (let movie of list) {
    let newMovie = {};
    newMovie.prettyName = movie.name;
    newMovie.votes = [];
    newMovie.addedBy = movie.addedBy;
    newList[movie.name.toLowerCase()] = newMovie;
  }
  
  fs.writeFile(newFileName, JSON.stringify(newList), () => { });
  
});